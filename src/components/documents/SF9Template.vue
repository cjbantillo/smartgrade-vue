<template>
  <div class="sf9-container">
    <!-- FRONT PAGE -->
    <div
      class="sf9-page w-[8.5in] h-[13in] bg-white p-8 print:break-after-page"
    >
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-xs font-semibold">Republic of the Philippines</div>
        <div class="text-xs">Department of Education</div>
        <div class="text-sm font-bold mt-2">SCHOOL FORM 9 (SF9)</div>
        <div class="text-xs">(Formerly Form 138)</div>
        <div class="text-xs mt-2">LEARNER'S PROGRESS REPORT CARD</div>
      </div>

      <!-- Student Information -->
      <div class="grid grid-cols-2 gap-x-8 gap-y-1 mb-6 text-xs">
        <div class="flex">
          <span class="font-semibold min-w-[80px]">Name:</span>
          <span class="border-b border-gray-700 flex-1 px-2">
            {{ grades.student_name }}
          </span>
        </div>
        <div class="flex">
          <span class="font-semibold min-w-[40px]">LRN:</span>
          <span class="border-b border-gray-700 flex-1 px-2">
            {{ grades.lrn }}
          </span>
        </div>
        <div class="flex">
          <span class="font-semibold min-w-[80px]">Grade Level:</span>
          <span class="border-b border-gray-700 flex-1 px-2">
            {{ grades.grade_level }}
          </span>
        </div>
        <div class="flex">
          <span class="font-semibold min-w-[40px]">Section:</span>
          <span class="border-b border-gray-700 flex-1 px-2">
            {{ grades.section }}
          </span>
        </div>
        <div class="flex">
          <span class="font-semibold min-w-[80px]">School Year:</span>
          <span class="border-b border-gray-700 flex-1 px-2">
            {{ grades.school_year }}
          </span>
        </div>
        <div class="flex">
          <span class="font-semibold min-w-[40px]">Track:</span>
          <span class="border-b border-gray-700 flex-1 px-2">
            {{ grades.track || "N/A" }}
          </span>
        </div>
      </div>

      <!-- Attendance Table -->
      <div class="mb-6">
        <div class="text-xs font-semibold mb-2">ATTENDANCE RECORD</div>
        <table class="w-full border-collapse border border-gray-700 text-xs">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-700 p-2">Month</th>
              <th class="border border-gray-700 p-2">Days of School</th>
              <th class="border border-gray-700 p-2">Days Present</th>
              <th class="border border-gray-700 p-2">Days Absent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in attendanceRecords" :key="index">
              <td class="border border-gray-700 p-2">{{ record.month }}</td>
              <td class="border border-gray-700 p-2 text-center">
                {{ record.school_days }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ record.days_present }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ record.days_absent }}
              </td>
            </tr>
            <tr class="font-semibold bg-gray-50">
              <td class="border border-gray-700 p-2">TOTAL</td>
              <td class="border border-gray-700 p-2 text-center">
                {{ totalSchoolDays }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ totalPresent }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ totalAbsent }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Parent Acknowledgment -->
      <div class="grid grid-cols-2 gap-8 mt-12 text-xs">
        <div>
          <div class="mb-2">First Semester</div>
          <div class="flex flex-col gap-2">
            <div class="flex items-end">
              <span class="border-b border-gray-700 flex-1 mr-2" />
              <span class="text-xs">Date</span>
            </div>
            <div>
              <div class="border-b border-gray-700 mb-1" />
              <div class="text-center">Signature of Parent/Guardian</div>
            </div>
          </div>
        </div>
        <div>
          <div class="mb-2">Second Semester</div>
          <div class="flex flex-col gap-2">
            <div class="flex items-end">
              <span class="border-b border-gray-700 flex-1 mr-2" />
              <span class="text-xs">Date</span>
            </div>
            <div>
              <div class="border-b border-gray-700 mb-1" />
              <div class="text-center">Signature of Parent/Guardian</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BACK PAGE -->
    <div class="sf9-page w-[8.5in] h-[13in] bg-white p-8">
      <!-- Scholastic Grades -->
      <div class="mb-6">
        <div class="text-xs font-semibold mb-2">SCHOLASTIC RECORD</div>
        <table class="w-full border-collapse border border-gray-700 text-xs">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-700 p-2 w-1/3" rowspan="2">
                Learning Areas
              </th>
              <th class="border border-gray-700 p-1" colspan="3">
                1st Semester
              </th>
              <th class="border border-gray-700 p-1" colspan="3">
                2nd Semester
              </th>
              <th class="border border-gray-700 p-2 w-20" rowspan="2">
                Final Rating
              </th>
            </tr>
            <tr class="bg-gray-100">
              <th class="border border-gray-700 p-1 w-16">Q1</th>
              <th class="border border-gray-700 p-1 w-16">Q2</th>
              <th class="border border-gray-700 p-1 w-16">SEM</th>
              <th class="border border-gray-700 p-1 w-16">Q3</th>
              <th class="border border-gray-700 p-1 w-16">Q4</th>
              <th class="border border-gray-700 p-1 w-16">SEM</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="subject in sortedSubjects" :key="subject.subject_name">
              <td class="border border-gray-700 p-2">
                {{ subject.subject_name }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ subject.semester_1_q1 || "-" }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ subject.semester_1_q2 || "-" }}
              </td>
              <td class="border border-gray-700 p-2 text-center font-semibold">
                {{ subject.semester_1_final || "-" }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ subject.semester_2_q1 || "-" }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ subject.semester_2_q2 || "-" }}
              </td>
              <td class="border border-gray-700 p-2 text-center font-semibold">
                {{ subject.semester_2_final || "-" }}
              </td>
              <td
                class="border border-gray-700 p-2 text-center font-semibold bg-gray-50"
              >
                {{ subject.final_rating || "-" }}
              </td>
            </tr>
            <tr class="font-semibold bg-gray-100">
              <td class="border border-gray-700 p-2">GENERAL AVERAGE</td>
              <td class="border border-gray-700 p-2 text-center" colspan="7">
                {{ generalAverage || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Observed Values -->
      <div class="mb-6">
        <div class="text-xs font-semibold mb-2">OBSERVED VALUES</div>
        <table class="w-full border-collapse border border-gray-700 text-xs">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-700 p-2 text-left">Core Values</th>
              <th class="border border-gray-700 p-2 text-left">
                Behavior Indicators
              </th>
              <th class="border border-gray-700 p-2 w-24">1st Sem</th>
              <th class="border border-gray-700 p-2 w-24">2nd Sem</th>
            </tr>
          </thead>
          <tbody>
            <!-- Maka-Diyos -->
            <tr>
              <td class="border border-gray-700 p-2 font-semibold" rowspan="2">
                1. Maka-Diyos
              </td>
              <td class="border border-gray-700 p-2">
                Expresses one's spiritual beliefs while respecting the spiritual
                beliefs of others
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makadiyos_1", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makadiyos_1", 2) }}
              </td>
            </tr>
            <tr>
              <td class="border border-gray-700 p-2">
                Shows adherence to ethical principles by upholding truth
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makadiyos_2", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makadiyos_2", 2) }}
              </td>
            </tr>

            <!-- Makatao -->
            <tr>
              <td class="border border-gray-700 p-2 font-semibold" rowspan="2">
                2. Makatao
              </td>
              <td class="border border-gray-700 p-2">
                Is sensitive to individual, social, and cultural differences
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makatao_1", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makatao_1", 2) }}
              </td>
            </tr>
            <tr>
              <td class="border border-gray-700 p-2">
                Demonstrates contributions toward solidarity
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makatao_2", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makatao_2", 2) }}
              </td>
            </tr>

            <!-- Makakalikasan -->
            <tr>
              <td class="border border-gray-700 p-2 font-semibold">
                3. Makakalikasan
              </td>
              <td class="border border-gray-700 p-2">
                Cares for the environment and utilizes resources wisely,
                judiciously, and economically
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makakalikasan_1", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makakalikasan_1", 2) }}
              </td>
            </tr>

            <!-- Makabansa -->
            <tr>
              <td class="border border-gray-700 p-2 font-semibold" rowspan="2">
                4. Makabansa
              </td>
              <td class="border border-gray-700 p-2">
                Demonstrates pride in being a Filipino; exercises the rights and
                responsibilities of a Filipino citizen
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makabansa_1", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makabansa_1", 2) }}
              </td>
            </tr>
            <tr>
              <td class="border border-gray-700 p-2">
                Demonstrates appropriate behavior in carrying out activities in
                the school, community, and country
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makabansa_2", 1) }}
              </td>
              <td class="border border-gray-700 p-2 text-center">
                {{ getValueRating("makabansa_2", 2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grading Scale -->
      <div class="text-xs">
        <div class="font-semibold mb-2">GRADING SCALE & DESCRIPTORS</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="font-semibold mb-1">For Scholastic Grades:</div>
            <div class="ml-4">
              <div>90-100 - Outstanding (O)</div>
              <div>85-89 - Very Satisfactory (VS)</div>
              <div>80-84 - Satisfactory (S)</div>
              <div>75-79 - Fairly Satisfactory (FS)</div>
              <div>Below 75 - Did Not Meet Expectations (DNM)</div>
            </div>
          </div>
          <div>
            <div class="font-semibold mb-1">For Observed Values:</div>
            <div class="ml-4">
              <div>AO - Always Observed</div>
              <div>SO - Sometimes Observed</div>
              <div>RO - Rarely Observed</div>
              <div>NO - Not Observed</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Certification -->
      <div class="mt-8 text-xs">
        <div class="grid grid-cols-2 gap-8">
          <div>
            <div class="mb-4">
              <div>Prepared by:</div>
              <div class="mt-8 border-b border-gray-700 w-64" />
              <div class="text-center w-64">
                Adviser's Signature over Printed Name
              </div>
            </div>
            <div>
              <div>Certified True and Correct:</div>
              <div class="mt-8 border-b border-gray-700 w-64" />
              <div class="text-center w-64">
                School Head's Signature over Printed Name
              </div>
            </div>
          </div>

          <!-- QR Code for Verification -->
          <div
            v-if="verificationId"
            class="flex flex-col items-center justify-center"
          >
            <div class="text-center mb-2 text-xs font-semibold">
              Scan to Verify
            </div>
            <QrcodeVue
              class="border-2 border-gray-700 p-1"
              level="H"
              :size="100"
              :value="verificationUrl"
            />
            <div class="text-center mt-1 text-[8px] text-gray-600">
              Document ID: {{ verificationId.slice(0, 8) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import QrcodeVue from 'qrcode-vue3'
  import { computed } from 'vue'

  interface Subject {
    subject_name: string
    semester_1_q1: number | null
    semester_1_q2: number | null
    semester_1_final: number | null
    semester_2_q1: number | null
    semester_2_q2: number | null
    semester_2_final: number | null
    final_rating: number | null
  }

  interface AttendanceRecord {
    month: string
    school_days: number
    days_present: number
    days_absent: number
  }

  interface SF9Data {
    student_name: string
    lrn: string
    grade_level: number
    section: string
    school_year: string
    track: string | null
    subjects: Subject[]
    general_average: number | null
  }

  interface Props {
    grades: SF9Data
    metadata?: Record<string, any>
    verificationId?: string
  }

  const props = defineProps<Props>()

  // Verification URL for QR code
  const verificationUrl = computed(() => {
    if (!props.verificationId) return ''
    return `${window.location.origin}/verify/${props.verificationId}`
  })

  // Attendance records from metadata or default
  const attendanceRecords = computed<AttendanceRecord[]>(() => {
    if (props.metadata?.attendance && Array.isArray(props.metadata.attendance)) {
      return props.metadata.attendance
    }

    // Default attendance records for 10 months
    return [
      { month: 'June', school_days: 20, days_present: 20, days_absent: 0 },
      { month: 'July', school_days: 22, days_present: 22, days_absent: 0 },
      { month: 'August', school_days: 23, days_present: 23, days_absent: 0 },
      { month: 'September', school_days: 21, days_present: 21, days_absent: 0 },
      { month: 'October', school_days: 22, days_present: 22, days_absent: 0 },
      { month: 'November', school_days: 19, days_present: 19, days_absent: 0 },
      { month: 'December', school_days: 15, days_present: 15, days_absent: 0 },
      { month: 'January', school_days: 20, days_present: 20, days_absent: 0 },
      { month: 'February', school_days: 20, days_present: 20, days_absent: 0 },
      { month: 'March', school_days: 22, days_present: 22, days_absent: 0 },
    ]
  })

  const totalSchoolDays = computed(() =>
    attendanceRecords.value.reduce((sum, record) => sum + record.school_days, 0),
  )

  const totalPresent = computed(() =>
    attendanceRecords.value.reduce((sum, record) => sum + record.days_present, 0),
  )

  const totalAbsent = computed(() =>
    attendanceRecords.value.reduce((sum, record) => sum + record.days_absent, 0),
  )

  // Sort subjects by name
  const sortedSubjects = computed(() => {
    return [...props.grades.subjects].sort((a, b) =>
      a.subject_name.localeCompare(b.subject_name),
    )
  })

  const generalAverage = computed(() => {
    if (props.grades.general_average !== null) {
      return props.grades.general_average.toFixed(2)
    }
    return null
  })

  // Get value rating from metadata
  function getValueRating (indicator: string, semester: 1 | 2): string {
    const key = `${indicator}_sem${semester}`
    if (props.metadata?.values && props.metadata.values[key]) {
      return props.metadata.values[key]
    }
    return '-'
  }
</script>

<style scoped>
.sf9-container {
  font-family: "Arial", sans-serif;
  color: #000;
}

.sf9-page {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin: 0 auto 1rem;
}

@media print {
  .sf9-page {
    box-shadow: none;
    margin: 0;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

table {
  page-break-inside: auto;
}

tr {
  page-break-inside: avoid;
  page-break-after: auto;
}
</style>
