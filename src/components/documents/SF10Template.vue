<template>
  <div class="sf10-container">
    <div class="sf10-page w-[8.5in] min-h-[11in] bg-white p-8">
      <!-- Header -->
      <div class="text-center mb-4">
        <div class="text-xs font-semibold">Republic of the Philippines</div>
        <div class="text-xs">Department of Education</div>
        <div class="text-sm font-bold mt-2">
          SENIOR HIGH SCHOOL STUDENT PERMANENT RECORD
        </div>
        <div class="text-xs">(SF10-SHS)</div>
      </div>

      <!-- Learner Information -->
      <div class="mb-4 border-2 border-gray-700 p-3">
        <div class="text-xs font-semibold mb-2">LEARNER'S INFORMATION</div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div class="flex">
            <span class="font-semibold min-w-[100px]">Last Name:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              data.last_name
            }}</span>
          </div>
          <div class="flex">
            <span class="font-semibold min-w-[100px]">First Name:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              data.first_name
            }}</span>
          </div>
          <div class="flex">
            <span class="font-semibold min-w-[100px]">Middle Name:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              data.middle_name || "N/A"
            }}</span>
          </div>
          <div class="flex">
            <span class="font-semibold min-w-[100px]">LRN:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              data.lrn
            }}</span>
          </div>
          <div class="flex">
            <span class="font-semibold min-w-[100px]">Date of Birth:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              formatDate(data.date_of_birth)
            }}</span>
          </div>
          <div class="flex">
            <span class="font-semibold min-w-[100px]">Sex:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              data.sex
            }}</span>
          </div>
          <div class="flex col-span-2">
            <span class="font-semibold min-w-[100px]">Date of Admission:</span>
            <span class="border-b border-gray-700 flex-1 px-2">{{
              formatDate(data.date_of_admission)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Eligibility for SHS Enrolment -->
      <div class="mb-4 border border-gray-700 p-2">
        <div class="text-xs font-semibold mb-2">
          ELIGIBILITY FOR SHS ENROLMENT
        </div>
        <div class="grid grid-cols-4 gap-2 text-xs">
          <label class="flex items-center gap-1">
            <input
              :checked="data.eligibility === 'HS_COMPLETER'"
              class="pointer-events-none"
              disabled
              type="checkbox"
            >
            <span>High School Completer</span>
          </label>
          <label class="flex items-center gap-1">
            <input
              :checked="data.eligibility === 'JHS_COMPLETER'"
              class="pointer-events-none"
              disabled
              type="checkbox"
            >
            <span>Junior High School Completer</span>
          </label>
          <label class="flex items-center gap-1">
            <input
              :checked="data.eligibility === 'PEPT_PASSER'"
              class="pointer-events-none"
              disabled
              type="checkbox"
            >
            <span>PEPT Passer</span>
          </label>
          <label class="flex items-center gap-1">
            <input
              :checked="data.eligibility === 'ALS_PASSER'"
              class="pointer-events-none"
              disabled
              type="checkbox"
            >
            <span>ALS A&E Passer</span>
          </label>
        </div>
      </div>

      <!-- Scholastic Records (Loop per semester) -->
      <div
        v-for="(record, index) in data.scholastic_records"
        :key="index"
        class="mb-6 print:break-inside-avoid"
      >
        <!-- Record Header -->
        <div class="border-2 border-gray-700 p-2 bg-gray-100 mb-1">
          <div class="grid grid-cols-3 gap-2 text-xs font-semibold">
            <div>School: {{ record.school_name }}</div>
            <div>School ID: {{ record.school_id }}</div>
            <div>Grade Level: {{ record.grade_level }}</div>
            <div>Section: {{ record.section }}</div>
            <div>School Year: {{ record.school_year }}</div>
            <div>Semester: {{ record.semester }}</div>
            <div class="col-span-3">
              Track/Strand: {{ record.track_strand }}
            </div>
          </div>
        </div>

        <!-- Grades Table -->
        <table
          class="w-full border-collapse border border-gray-700 text-xs mb-2"
        >
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-700 p-1 w-32">INDICATE IF:</th>
              <th class="border border-gray-700 p-1">SUBJECTS</th>
              <th class="border border-gray-700 p-1 w-20">Quarter</th>
              <th class="border border-gray-700 p-1 w-20">SEM FINAL GRADE</th>
              <th class="border border-gray-700 p-1 w-24">ACTION TAKEN</th>
            </tr>
            <tr class="bg-gray-50 text-xs">
              <th class="border border-gray-700 p-1">
                <div>Core</div>
                <div>Applied</div>
                <div>Specialized</div>
              </th>
              <th class="border border-gray-700 p-1" />
              <th class="border border-gray-700 p-1">
                <div>1st</div>
                <div>2nd</div>
              </th>
              <th class="border border-gray-700 p-1" />
              <th class="border border-gray-700 p-1">
                <div>Passed</div>
                <div>Failed</div>
                <div>Incomplete</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(subject, sIndex) in record.subjects" :key="sIndex">
              <td class="border border-gray-700 p-1 text-center">
                {{ subject.indication }}
              </td>
              <td class="border border-gray-700 p-1">
                {{ subject.subject_name }}
              </td>
              <td class="border border-gray-700 p-1">
                <div class="text-center">{{ subject.quarter_1 || "-" }}</div>
                <div class="text-center">{{ subject.quarter_2 || "-" }}</div>
              </td>
              <td class="border border-gray-700 p-1 text-center font-semibold">
                {{ subject.final_grade || "-" }}
              </td>
              <td class="border border-gray-700 p-1 text-center">
                {{ subject.action_taken }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Remedial Class (if applicable) -->
        <div
          v-if="record.remedial_class && record.remedial_class.length > 0"
          class="mb-2"
        >
          <div class="text-xs font-semibold mb-1">REMEDIAL CLASS</div>
          <table class="w-full border-collapse border border-gray-700 text-xs">
            <thead>
              <tr class="bg-gray-50">
                <th class="border border-gray-700 p-1">SUBJECTS</th>
                <th class="border border-gray-700 p-1 w-24">SCHOOL YEAR</th>
                <th class="border border-gray-700 p-1 w-20">FINAL RATING</th>
                <th class="border border-gray-700 p-1 w-24">REMAR</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(remedial, rIndex) in record.remedial_class"
                :key="rIndex"
              >
                <td class="border border-gray-700 p-1">
                  {{ remedial.subject_name }}
                </td>
                <td class="border border-gray-700 p-1 text-center">
                  {{ remedial.school_year }}
                </td>
                <td class="border border-gray-700 p-1 text-center">
                  {{ remedial.final_rating }}
                </td>
                <td class="border border-gray-700 p-1 text-center">
                  {{ remedial.remarks }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Certification -->
      <div class="mt-8 border-t-2 border-gray-700 pt-4 text-xs">
        <div class="mb-6">
          <div class="font-semibold mb-2">CERTIFICATION</div>
          <div class="mb-4">
            I CERTIFY that this is a true record of
            <span class="border-b border-gray-700 px-2 font-semibold">
              {{ data.first_name }} {{ data.middle_name }} {{ data.last_name }}
            </span>
            with LRN
            <span class="border-b border-gray-700 px-2 font-semibold">
              {{ data.lrn }}
            </span>
            and that he/she is eligible for admission to
            <span class="border-b border-gray-700 px-16" />.
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 mt-8">
          <div>
            <div class="border-b border-gray-700 w-64 mb-1" />
            <div class="text-center w-64">
              <div>Signature of Principal/School Head</div>
              <div>Over Printed Name</div>
            </div>
          </div>
          <div>
            <div class="border-b border-gray-700 w-64 mb-1" />
            <div class="text-center w-64">Date</div>
          </div>
        </div>

        <div class="mt-6">
          <div class="grid grid-cols-2 gap-8">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">School:</span>
                <span class="border-b border-gray-700 flex-1 px-2">
                  {{ data.scholastic_records[0]?.school_name || "" }}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-semibold">School ID:</span>
                <span class="border-b border-gray-700 flex-1 px-2">
                  {{ data.scholastic_records[0]?.school_id || "" }}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-semibold">Address:</span>
                <span class="border-b border-gray-700 flex-1 px-2">
                  {{ data.school_address || "" }}
                </span>
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
  </div>
</template>

<script setup lang="ts">
  import QrcodeVue from 'qrcode-vue3'
  import { computed } from 'vue'

  interface Subject {
    indication: 'Core' | 'Applied' | 'Specialized'
    subject_name: string
    quarter_1: number | null
    quarter_2: number | null
    final_grade: number | null
    action_taken: 'Passed' | 'Failed' | 'Incomplete'
  }

  interface RemedialClass {
    subject_name: string
    school_year: string
    final_rating: number
    remarks: string
  }

  interface ScholasticRecord {
    school_name: string
    school_id: string
    grade_level: number
    section: string
    school_year: string
    semester: number
    track_strand: string
    subjects: Subject[]
    remedial_class?: RemedialClass[]
  }

  interface SF10Data {
    last_name: string
    first_name: string
    middle_name: string | null
    lrn: string
    date_of_birth: string
    sex: 'Male' | 'Female'
    date_of_admission: string
    eligibility: 'HS_COMPLETER' | 'JHS_COMPLETER' | 'PEPT_PASSER' | 'ALS_PASSER'
    school_address?: string
    scholastic_records: ScholasticRecord[]
  }

  interface Props {
    data: SF10Data
    metadata?: Record<string, any>
    verificationId?: string
  }

  const props = defineProps<Props>()

  // Verification URL for QR code
  const verificationUrl = computed(() => {
    if (!props.verificationId) return ''
    return `${window.location.origin}/verify/${props.verificationId}`
  })

  function formatDate (dateString: string | null): string {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
</script>

<style scoped>
.sf10-container {
  font-family: "Arial", sans-serif;
  color: #000;
}

.sf10-page {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin: 0 auto 1rem;
}

@media print {
  .sf10-page {
    box-shadow: none;
    margin: 0;
    page-break-after: always;
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

input[type="checkbox"]:disabled {
  opacity: 0.6;
}
</style>
