import { validateStudyPack, ValidationError } from '../services/validator';

function runTests() {
  console.log('=== RUNNING AI VALIDATOR UNIT TESTS ===');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  const validSample = {
    title: 'Introduction to Operating Systems',
    summary: 'An OS manages hardware, provides execution environments, and schedules processes.',
    keyPoints: [
      'Kernel operates in privileged mode.',
      'Virtual memory abstracts physical RAM.',
      'Process scheduling uses algorithms like Round Robin.'
    ],
    questions: [
      {
        question: 'What is the primary role of the OS kernel?',
        options: ['Manage hardware resources', 'Run web browsers', 'Render 3D graphics', 'Format disks continuously'],
        correctAnswer: 'Manage hardware resources',
        explanation: 'The kernel is the core component managing hardware and CPU execution.'
      },
      {
        question: 'Which mode does the kernel execute in?',
        options: ['User mode', 'Privileged / Kernel mode', 'Safe mode', 'Virtual mode'],
        correctAnswer: 'Privileged / Kernel mode',
        explanation: 'Kernel code runs in privileged mode to access raw hardware.'
      },
      {
        question: 'What is the purpose of virtual memory?',
        options: ['Provide process address isolation', 'Increase monitor refresh rate', 'Compress hard drive', 'Overclock the processor'],
        correctAnswer: 'Provide process address isolation',
        explanation: 'Virtual memory isolates process address spaces and prevents corruption.'
      },
      {
        question: 'Which is a common CPU scheduling algorithm?',
        options: ['Round Robin', 'Linear Regression', 'QuickSort', 'Binary Search'],
        correctAnswer: 'Round Robin',
        explanation: 'Round Robin is a preemptive time-slice CPU scheduling algorithm.'
      },
      {
        question: 'What triggers a context switch?',
        options: ['Timer interrupt or system call', 'Monitor power off', 'Mouse movement', 'Sound card mute'],
        correctAnswer: 'Timer interrupt or system call',
        explanation: 'Timer interrupts and syscalls signal the OS scheduler to switch tasks.'
      }
    ]
  };

  // Test 1: Valid study pack passes cleanly
  try {
    const result = validateStudyPack(validSample);
    assert(result.questions.length === 5 && result.title === 'Introduction to Operating Systems', 'Valid study pack passes validation');
  } catch (err: any) {
    assert(false, `Valid study pack failed: ${err.message}`);
  }

  // Test 2: Valid study pack in stringified JSON format passes
  try {
    const jsonString = JSON.stringify(validSample);
    const result = validateStudyPack(jsonString);
    assert(result.questions.length === 5, 'Stringified JSON study pack parses and passes');
  } catch (err: any) {
    assert(false, `Stringified JSON failed: ${err.message}`);
  }

  // Test 3: Malformed JSON string fails
  try {
    validateStudyPack('{"title": "Unclosed JSON');
    assert(false, 'Malformed JSON should throw ValidationError');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'MALFORMED_JSON', 'Malformed JSON throws MALFORMED_JSON error');
  }

  // Test 4: Missing title fails
  try {
    const invalid = { ...validSample, title: '   ' };
    validateStudyPack(invalid);
    assert(false, 'Missing title should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'MISSING_TITLE', 'Empty title throws MISSING_TITLE');
  }

  // Test 5: Missing summary fails
  try {
    const invalid = { ...validSample, summary: '' };
    validateStudyPack(invalid);
    assert(false, 'Missing summary should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'MISSING_SUMMARY', 'Empty summary throws MISSING_SUMMARY');
  }

  // Test 6: Missing key points fails
  try {
    const invalid = { ...validSample, keyPoints: [] };
    validateStudyPack(invalid);
    assert(false, 'Empty key points should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'MISSING_KEY_POINTS', 'Empty keyPoints throws MISSING_KEY_POINTS');
  }

  // Test 7: Wrong question count (4 questions instead of 5) fails
  try {
    const invalid = { ...validSample, questions: validSample.questions.slice(0, 4) };
    validateStudyPack(invalid);
    assert(false, 'Fewer than 5 questions should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'INVALID_QUESTION_COUNT', '4 questions throws INVALID_QUESTION_COUNT');
  }

  // Test 8: Wrong question count (6 questions instead of 5) fails
  try {
    const invalid = { ...validSample, questions: [...validSample.questions, validSample.questions[0]] };
    validateStudyPack(invalid);
    assert(false, 'More than 5 questions should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'INVALID_QUESTION_COUNT', '6 questions throws INVALID_QUESTION_COUNT');
  }

  // Test 9: Question with 3 options fails
  try {
    const invalid = JSON.parse(JSON.stringify(validSample));
    invalid.questions[0].options = ['Option A', 'Option B', 'Option C'];
    validateStudyPack(invalid);
    assert(false, '3 options should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'INVALID_OPTION_COUNT', '3 options throws INVALID_OPTION_COUNT');
  }

  // Test 10: Duplicate options fail
  try {
    const invalid = JSON.parse(JSON.stringify(validSample));
    invalid.questions[0].options = ['Option A', 'Option B', 'Option A', 'Option D'];
    validateStudyPack(invalid);
    assert(false, 'Duplicate options should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'DUPLICATE_OPTIONS', 'Duplicate options throws DUPLICATE_OPTIONS');
  }

  // Test 11: correctAnswer not in options fails
  try {
    const invalid = JSON.parse(JSON.stringify(validSample));
    invalid.questions[0].correctAnswer = 'A Completely Different Answer';
    validateStudyPack(invalid);
    assert(false, 'Mismatched correctAnswer should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'ANSWER_NOT_IN_OPTIONS', 'Mismatched correctAnswer throws ANSWER_NOT_IN_OPTIONS');
  }

  // Test 12: Missing explanation fails
  try {
    const invalid = JSON.parse(JSON.stringify(validSample));
    invalid.questions[0].explanation = '';
    validateStudyPack(invalid);
    assert(false, 'Empty explanation should fail');
  } catch (err: any) {
    assert(err instanceof ValidationError && err.code === 'MISSING_EXPLANATION', 'Empty explanation throws MISSING_EXPLANATION');
  }

  console.log(`\nResults: ${passed} of ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
