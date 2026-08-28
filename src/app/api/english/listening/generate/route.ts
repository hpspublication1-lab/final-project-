import { NextRequest, NextResponse } from 'next/server';

export interface IELTSListeningTask {
  id: string;
  section: 1 | 2 | 3 | 4;
  title: string;
  contextDescription: string;
  accent: 'British' | 'Australian' | 'North American';
  audioTranscript: string;
  questions: Array<{
    id: number;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = parseInt(searchParams.get('section') || '1', 10) as 1 | 2 | 3 | 4;

  const mockTasks: Record<number, IELTSListeningTask> = {
    1: {
      id: 'list_sec1_01',
      section: 1,
      title: 'University Campus Accommodation Booking',
      contextDescription: 'Conversation between an incoming international student and a housing officer.',
      accent: 'British',
      audioTranscript: `Housing Officer: Good morning! Welcome to the International Student Housing Office. How can I help you today?
Student: Hello! I'm calling to check my reservation for the university hall of residence. My name is Alex Sanders.
Housing Officer: Let me search the database... Ah yes, Alex Sanders. You have booked a single room in Westgate Hall for the autumn term starting September 15th.
Student: Perfect! Could you confirm if electricity and internet are included in the weekly rent of £145?
Housing Officer: Yes, all utility bills and high-speed Wi-Fi are fully included. However, there is a one-time security deposit of £200 payable before check-in.`,
      questions: [
        {
          id: 1,
          questionText: 'What date does the accommodation reservation start?',
          options: ['September 1st', 'September 15th', 'October 1st', 'August 30th'],
          correctAnswer: 'September 15th',
          explanation: 'The housing officer states: "starting September 15th".',
        },
        {
          id: 2,
          questionText: 'How much is the weekly rent for Westgate Hall?',
          options: ['£125', '£145', '£200', '£150'],
          correctAnswer: '£145',
          explanation: 'The student asks to confirm "weekly rent of £145".',
        },
        {
          id: 3,
          questionText: 'What is the amount of the security deposit required?',
          options: ['£100', '£145', '£200', '£250'],
          correctAnswer: '£200',
          explanation: 'The officer confirms a "one-time security deposit of £200".',
        },
      ],
    },
    2: {
      id: 'list_sec2_01',
      section: 2,
      title: 'National Maritime Museum Guided Tour',
      contextDescription: 'Monologue by a museum tour guide explaining opening hours and key exhibits.',
      accent: 'Australian',
      audioTranscript: `Welcome everyone to the National Maritime Museum! My name is Sarah and I'll be your guide today. Before we begin, please note that the main gallery is open daily from 9:30 AM to 5:00 PM. Our most famous exhibit, the 18th-century Royal Clipper vessel, is located on Level 2 in the East Wing. Flash photography is strictly prohibited inside the historical archive room.`,
      questions: [
        {
          id: 1,
          questionText: 'Where is the Royal Clipper vessel exhibit located?',
          options: ['Level 1 West Wing', 'Level 2 East Wing', 'Basement Gallery', 'Ground Floor'],
          correctAnswer: 'Level 2 East Wing',
          explanation: 'The guide mentions: "located on Level 2 in the East Wing".',
        },
        {
          id: 2,
          questionText: 'What is strictly prohibited inside the historical archive room?',
          options: ['Mobile phones', 'Flash photography', 'Food and drinks', 'Backpacks'],
          correctAnswer: 'Flash photography',
          explanation: 'The guide states: "Flash photography is strictly prohibited".',
        },
      ],
    },
  };

  const task = mockTasks[section] || mockTasks[1];
  return NextResponse.json(task);
}
