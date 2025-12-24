import { ref } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuth } from './useAuth'

// Student Grade Interface
export interface StudentGrade {
  id: string
  subject_code: string
  subject_name: string
  grading_period: number
  written_work: number | null
  performance_task: number | null
  quarterly_assessment: number | null
  quarterly_grade: number | null
  final_grade: number | null
  remarks: string | null
  teacher_name: string
  is_finalized: boolean
}

// Student GPA Interface
export interface StudentGPA {
  student_id: string
  school_year_id: string
  school_year_code: string
  semester: number
  general_average: number
  is_finalized: boolean
  honors_designation: string | null
  finalized_at: string | null
}

// Student Document Interface
export interface StudentDocument {
  type: 'SF9' | 'SF10'
  school_year_id: string
  school_year_code: string
  available: boolean
}

// Student Info Interface
export interface StudentInfo {
  id: string
  lrn: string
  first_name: string
  last_name: string
  middle_name: string | null
  grade_level: string
  track: string
  strand: string
  section: string | null
}

export function useStudent () {
  const authStore = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get student ID from authenticated user
   */
  async function getStudentId (): Promise<string | null> {
    try {
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authStore.user?.id)
        .single()

      if (fetchError || !data) {
        console.error('Error fetching student ID:', fetchError)
        return null
      }

      return data.id
    } catch (error_) {
      console.error('Unexpected error getting student ID:', error_)
      return null
    }
  }

  /**
   * Fetch student information
   */
  async function fetchStudentInfo (): Promise<StudentInfo | null> {
    loading.value = true
    error.value = null

    try {
      const studentId = await getStudentId()
      if (!studentId) {
        error.value = 'Student record not found'
        return null
      }

      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (fetchError || !data) {
        console.error('Error fetching student info:', fetchError)
        error.value = 'Failed to load student information'
        return null
      }

      return data
    } catch (error_) {
      console.error('Unexpected error fetching student info:', error_)
      error.value = 'An unexpected error occurred'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student grades for a specific school year
   */
  async function fetchStudentGrades (
    schoolYearId: string,
  ): Promise<StudentGrade[]> {
    loading.value = true
    error.value = null

    try {
      const studentId = await getStudentId()
      if (!studentId) {
        error.value = 'Student record not found'
        return []
      }

      // Fetch grades with subject and teacher information
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(
          `
          id,
          written_work,
          performance_task,
          quarterly_assessment,
          quarterly_grade,
          subjects:subject_id (
            code,
            name
          ),
          grading_periods:grading_period_id (
            period_number
          ),
          class_assignments:class_id (
            teacher_id,
            profiles:teacher_id (
              first_name,
              last_name
            )
          )
        `,
        )
        .eq('student_id', studentId)
        .eq('school_year_id', schoolYearId)

      if (gradesError) {
        console.error('Error fetching grades:', gradesError)
        error.value = 'Failed to load grades'
        return []
      }

      // Fetch final grades
      const { data: finalGrades, error: finalError } = await supabase
        .from('final_grades')
        .select('subject_id, final_grade, remarks')
        .eq('student_id', studentId)
        .eq('school_year_id', schoolYearId)

      if (finalError) {
        console.error('Error fetching final grades:', finalError)
      }

      // Check finalization status
      const { data: finalizationStatus, error: finalizationError }
        = await supabase
          .from('grade_finalization_status')
          .select('is_finalized')
          .eq('student_id', studentId)
          .eq('school_year_id', schoolYearId)
          .eq('semester', '1')
          .single()

      if (finalizationError) {
        console.error('Error fetching finalization status:', finalizationError)
      }

      const isFinalized = finalizationStatus?.is_finalized || false

      // Map final grades by subject
      const finalGradeMap = new Map(
        (finalGrades || []).map(fg => [fg.subject_id, fg]),
      )

      // Transform and combine data
      const studentGrades: StudentGrade[] = (grades || []).map((grade: any) => {
        const subject = grade.subjects
        const period = grade.grading_periods
        const assignment = grade.class_assignments
        const teacher = assignment?.profiles

        const finalGrade = finalGradeMap.get(subject.id)

        return {
          id: grade.id,
          subject_code: subject?.code || 'N/A',
          subject_name: subject?.name || 'Unknown Subject',
          grading_period: period?.period_number || 0,
          written_work: grade.written_work,
          performance_task: grade.performance_task,
          quarterly_assessment: grade.quarterly_assessment,
          quarterly_grade: grade.quarterly_grade,
          final_grade: finalGrade?.final_grade || null,
          remarks: finalGrade?.remarks || null,
          teacher_name: teacher
            ? `${teacher.first_name} ${teacher.last_name}`
            : 'N/A',
          is_finalized: isFinalized,
        }
      })

      // Sort by subject and grading period
      studentGrades.sort((a, b) => {
        if (a.subject_code !== b.subject_code) {
          return a.subject_code.localeCompare(b.subject_code)
        }
        return a.grading_period - b.grading_period
      })

      return studentGrades
    } catch (error_) {
      console.error('Unexpected error fetching grades:', error_)
      error.value = 'An unexpected error occurred'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student GPA for all school years
   */
  async function fetchStudentGPA (): Promise<StudentGPA[]> {
    loading.value = true
    error.value = null

    try {
      const studentId = await getStudentId()
      if (!studentId) {
        error.value = 'Student record not found'
        return []
      }

      const { data, error: fetchError } = await supabase
        .from('grade_finalization_status')
        .select(
          `
          *,
          school_years:school_year_id (
            year_code
          )
        `,
        )
        .eq('student_id', studentId)
        .order('school_year_id', { ascending: false })

      if (fetchError) {
        console.error('Error fetching GPA:', fetchError)
        error.value = 'Failed to load GPA information'
        return []
      }

      return (data || []).map((record: any) => {
        const gpa = record.general_average || 0
        let honors: string | null = null

        if (gpa >= 98) {
          honors = 'With Highest Honors'
        } else if (gpa >= 95) {
          honors = 'With High Honors'
        } else if (gpa >= 90) {
          honors = 'With Honors'
        }

        return {
          student_id: record.student_id,
          school_year_id: record.school_year_id,
          school_year_code: record.school_years?.year_code || 'N/A',
          semester: record.semester,
          general_average: gpa,
          is_finalized: record.is_finalized,
          honors_designation: honors,
          finalized_at: record.finalized_at,
        }
      })
    } catch (error_) {
      console.error('Unexpected error fetching GPA:', error_)
      error.value = 'An unexpected error occurred'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch available documents (SF9/SF10) for student
   */
  async function fetchStudentDocuments (): Promise<StudentDocument[]> {
    loading.value = true
    error.value = null

    try {
      const studentId = await getStudentId()
      if (!studentId) {
        error.value = 'Student record not found'
        return []
      }

      // Get all finalized school years for student
      const { data: finalizedYears, error: fetchError } = await supabase
        .from('grade_finalization_status')
        .select(
          `
          school_year_id,
          is_finalized,
          school_years:school_year_id (
            year_code
          )
        `,
        )
        .eq('student_id', studentId)
        .eq('is_finalized', true)

      if (fetchError) {
        console.error('Error fetching documents:', fetchError)
        error.value = 'Failed to load documents'
        return []
      }

      // Create document records for each finalized year
      const documents: StudentDocument[] = []

      for (const year of finalizedYears || []) {
        // SF9 available for each school year
        documents.push({
          type: 'SF9',
          school_year_id: year.school_year_id,
          school_year_code: year.school_years?.year_code || 'N/A',
          available: true,
        })
      }

      // SF10 is cumulative (one per student)
      if ((finalizedYears || []).length > 0) {
        documents.push({
          type: 'SF10',
          school_year_id: '', // Not specific to one year
          school_year_code: 'All Years',
          available: true,
        })
      }

      return documents
    } catch (error_) {
      console.error('Unexpected error fetching documents:', error_)
      error.value = 'An unexpected error occurred'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student certificates
   */
  async function fetchStudentCertificates (): Promise<any[]> {
    loading.value = true
    error.value = null

    try {
      const studentId = await getStudentId()
      if (!studentId) {
        error.value = 'Student record not found'
        return []
      }

      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select(
          `
          *,
          school_years:school_year_id (
            year_code
          )
        `,
        )
        .eq('student_id', studentId)
        .eq('is_revoked', false)
        .order('generated_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching certificates:', fetchError)
        error.value = 'Failed to load certificates'
        return []
      }

      return data || []
    } catch (error_) {
      console.error('Unexpected error fetching certificates:', error_)
      error.value = 'An unexpected error occurred'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get active school year
   */
  async function getActiveSchoolYear (): Promise<any> {
    try {
      const { data, error: fetchError } = await supabase
        .from('school_years')
        .select('*')
        .eq('is_active', true)
        .single()

      if (fetchError || !data) {
        console.error('Error fetching active school year:', fetchError)
        return null
      }

      return data
    } catch (error_) {
      console.error('Unexpected error fetching active school year:', error_)
      return null
    }
  }

  return {
    loading,
    error,
    getStudentId,
    fetchStudentInfo,
    fetchStudentGrades,
    fetchStudentGPA,
    fetchStudentDocuments,
    fetchStudentCertificates,
    getActiveSchoolYear,
  }
}
