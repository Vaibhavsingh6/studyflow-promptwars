import { PDFDocument, StandardFonts } from 'pdf-lib';
import { extractTextFromPdf, PdfExtractionError } from '../services/pdfExtractor';
import { validateStudyPack, ValidationError } from '../services/validator';

// Helper to synthesize standard valid PDF documents using pdf-lib
async function createValidPdf(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 400]);
  let y = 350;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 12, font });
    y -= 20;
  }
  const bytes = await doc.save({ useObjectStreams: false });
  return Buffer.from(bytes);
}

async function runSuite() {
  console.log('=====================================================');
  console.log('       STUDYFLOW PHASE 2 COMPREHENSIVE TEST SUITE     ');
  console.log('=====================================================');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS ${total}] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ [FAIL ${total}] ${name}:`, err.stack || err.message);
    }
  }

  // --- PDF EXTRACTION TESTS ---
  const validLectureLines = [
    'Operating Systems Lecture 1: Process Scheduling',
    'Virtual Memory Management in Modern Operating System Kernels.',
    'Key concepts include preemptive multitasking and memory isolation.'
  ];
  const tinyLines = ['Hi.'];

  await test('PDF Extraction: Valid PDF extracts readable lecture text (>50 chars)', async () => {
    const validPdfBuffer = await createValidPdf(validLectureLines);
    const text = await extractTextFromPdf(validPdfBuffer);
    if (!text.includes('Operating Systems Lecture 1')) {
      throw new Error(`Extracted text missing expected content: "${text}"`);
    }
  });

  await test('PDF Extraction: Rejects empty PDF buffer', async () => {
    try {
      await extractTextFromPdf(Buffer.alloc(0));
      throw new Error('Should have rejected empty buffer');
    } catch (err: any) {
      if (!(err instanceof PdfExtractionError) || err.code !== 'EMPTY_PDF') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('PDF Extraction: Rejects PDF with insufficient extractable text (<50 chars)', async () => {
    try {
      const tinyPdfBuffer = await createValidPdf(tinyLines);
      await extractTextFromPdf(tinyPdfBuffer);
      throw new Error('Should have rejected tiny PDF');
    } catch (err: any) {
      if (!(err instanceof PdfExtractionError) || err.code !== 'INSUFFICIENT_TEXT') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  // --- STRICT SCHEMA & BUSINESS VALIDATION TESTS ---
  const validSample = {
    title: 'Operating Systems - Process Scheduling',
    summary: 'The OS schedules processes using time-sharing and isolates memory with paging.',
    keyPoints: [
      'Preemptive vs Non-preemptive scheduling',
      'Virtual memory translation using page tables',
      'Context switching overhead'
    ],
    questions: [
      {
        question: 'What is the role of CPU scheduler?',
        options: ['Select next process to run', 'Compile source code', 'Compress disk', 'Manage network packets'],
        correctAnswer: 'Select next process to run',
        explanation: 'The scheduler allocates CPU time among runnable processes.'
      },
      {
        question: 'What happens during a context switch?',
        options: ['CPU registers are saved and restored', 'RAM is completely erased', 'Monitor is blanked', 'Kernel recompiles code'],
        correctAnswer: 'CPU registers are saved and restored',
        explanation: 'The CPU state must be preserved to resume the interrupted process.'
      },
      {
        question: 'What is a time slice in Round Robin?',
        options: ['Fixed CPU execution duration', 'Clock speed of CPU', 'Network latency', 'Disk seek time'],
        correctAnswer: 'Fixed CPU execution duration',
        explanation: 'Round Robin allocates a fixed quantum (time slice) per process.'
      },
      {
        question: 'What does virtual memory provide?',
        options: ['Process address space isolation', 'Faster GPU rendering', 'Unlimited physical RAM', 'Instant boot times'],
        correctAnswer: 'Process address space isolation',
        explanation: 'Virtual memory isolates processes so they cannot overwrite each other.'
      },
      {
        question: 'What structure translates virtual to physical addresses?',
        options: ['Page Table', 'Binary Heap', 'File Allocation Table', 'Socket Buffer'],
        correctAnswer: 'Page Table',
        explanation: 'Page tables map virtual page numbers to physical page frames.'
      }
    ]
  };

  await test('Validation: Valid study pack with exactly 5 questions passes', () => {
    const res = validateStudyPack(validSample);
    if (res.questions.length !== 5 || res.title !== validSample.title) {
      throw new Error('Study pack was not properly parsed or validated');
    }
  });

  await test('Validation: Stringified JSON study pack parses and passes', () => {
    const res = validateStudyPack(JSON.stringify(validSample));
    if (res.questions.length !== 5) {
      throw new Error('Stringified study pack failed');
    }
  });

  await test('Validation: Malformed JSON string is rejected with MALFORMED_JSON', () => {
    try {
      validateStudyPack('{ "title": "Incomplete');
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'MALFORMED_JSON') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Missing or whitespace-only title is rejected', () => {
    try {
      validateStudyPack({ ...validSample, title: '   ' });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'MISSING_TITLE') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Missing summary is rejected', () => {
    try {
      validateStudyPack({ ...validSample, summary: '' });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'MISSING_SUMMARY') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Empty keyPoints array is rejected', () => {
    try {
      validateStudyPack({ ...validSample, keyPoints: [] });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'MISSING_KEY_POINTS') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Fewer than 5 questions (e.g. 4) is rejected', () => {
    try {
      validateStudyPack({ ...validSample, questions: validSample.questions.slice(0, 4) });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'INVALID_QUESTION_COUNT') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: More than 5 questions (e.g. 6) is rejected', () => {
    try {
      validateStudyPack({ ...validSample, questions: [...validSample.questions, validSample.questions[0]] });
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'INVALID_QUESTION_COUNT') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Question with fewer than 4 options is rejected', () => {
    try {
      const invalid = JSON.parse(JSON.stringify(validSample));
      invalid.questions[0].options = ['Option A', 'Option B', 'Option C'];
      validateStudyPack(invalid);
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'INVALID_OPTION_COUNT') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Question with duplicate options is rejected', () => {
    try {
      const invalid = JSON.parse(JSON.stringify(validSample));
      invalid.questions[0].options = ['Option A', 'Option B', 'Option A', 'Option D'];
      validateStudyPack(invalid);
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'DUPLICATE_OPTIONS') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: correctAnswer that does not match options is rejected', () => {
    try {
      const invalid = JSON.parse(JSON.stringify(validSample));
      invalid.questions[0].correctAnswer = 'Option That Does Not Exist';
      validateStudyPack(invalid);
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'ANSWER_NOT_IN_OPTIONS') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  await test('Validation: Missing explanation is rejected', () => {
    try {
      const invalid = JSON.parse(JSON.stringify(validSample));
      invalid.questions[0].explanation = '';
      validateStudyPack(invalid);
      throw new Error('Should have failed');
    } catch (err: any) {
      if (!(err instanceof ValidationError) || err.code !== 'MISSING_EXPLANATION') {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
  });

  console.log('\n=====================================================');
  console.log(`TOTAL SUITE RESULTS: ${passed} of ${total} tests passed.`);
  console.log('=====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runSuite();
