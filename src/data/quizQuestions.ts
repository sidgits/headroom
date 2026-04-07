export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizQuestionData {
  id: number;
  question: string;
  answers: QuizAnswer[];
}

export const quizQuestions: QuizQuestionData[] = [
  {
    id: 1,
    question: "When you sit down to work, how quickly can you focus on what matters most?",
    answers: [
      { id: "A", text: "Almost immediately — I know exactly what needs doing" },
      { id: "B", text: "It takes a while — I have to sort through noise first" },
      { id: "C", text: "I usually get pulled into something unplanned" },
      { id: "D", text: "I rarely get to what matters most" },
    ],
  },
  {
    id: 2,
    question: "How many different responsibilities are you juggling right now?",
    answers: [
      { id: "A", text: "A focused few — I protect my priorities" },
      { id: "B", text: "Several, but I manage them well" },
      { id: "C", text: "Too many — things slip through the cracks" },
      { id: "D", text: "I've lost count — everything feels urgent" },
    ],
  },
  {
    id: 3,
    question: "When was the last time you had space to think deeply about your work?",
    answers: [
      { id: "A", text: "Today or yesterday" },
      { id: "B", text: "This week" },
      { id: "C", text: "I can't remember" },
      { id: "D", text: "I don't have that luxury" },
    ],
  },
  {
    id: 4,
    question: "How do you typically respond when new requests come in?",
    answers: [
      { id: "A", text: "I evaluate and decide — not everything gets a yes" },
      { id: "B", text: "I absorb them and figure it out later" },
      { id: "C", text: "I say yes to most things — it's hard to push back" },
      { id: "D", text: "I don't even notice anymore — they just pile up" },
    ],
  },
  {
    id: 5,
    question: "How connected do you feel to the growth areas of your role?",
    answers: [
      { id: "A", text: "Very — I'm actively developing new skills" },
      { id: "B", text: "Somewhat — I think about it but don't act often" },
      { id: "C", text: "Not much — survival mode takes priority" },
      { id: "D", text: "Disconnected — I'm just getting through the day" },
    ],
  },
  {
    id: 6,
    question: "At the end of a typical workday, how do you feel?",
    answers: [
      { id: "A", text: "Energised — I accomplished meaningful work" },
      { id: "B", text: "Tired but satisfied" },
      { id: "C", text: "Drained — busy all day but unsure what I achieved" },
      { id: "D", text: "Empty — I have nothing left" },
    ],
  },
];

export const roles = [
  { id: "manager", label: "People Manager", description: "Leading a team" },
  { id: "ic", label: "Individual Contributor", description: "Specialist or maker" },
  { id: "founder", label: "Founder / Executive", description: "Running the show" },
  { id: "freelancer", label: "Freelancer / Consultant", description: "Independent operator" },
  { id: "student", label: "Student / Early Career", description: "Building foundations" },
];
