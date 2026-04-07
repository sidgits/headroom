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
    question: "When you're deep in focused work and something urgent interrupts you, what actually happens?",
    answers: [
      { id: "A", text: "I protect my focus — deal with it on my own terms after I reach a stopping point" },
      { id: "B", text: "I switch immediately — I can usually pick up where I left off" },
      { id: "C", text: "I switch but lose the thread — recovery takes longer than the interruption" },
      { id: "D", text: "It depends entirely on context — urgency and source both matter to me" },
    ],
  },
  {
    id: 2,
    question: "Where does your best thinking happen?",
    answers: [
      { id: "A", text: "Alone, uninterrupted, with enough time to go properly deep" },
      { id: "B", text: "In dialogue — my ideas sharpen when I'm working through them with others" },
      { id: "C", text: "Under mild pressure — a deadline or constraint actually focuses me" },
      { id: "D", text: "I don't have a strong preference — I adapt to whatever the situation demands" },
    ],
  },
  {
    id: 3,
    question: "You're handed a complex problem with no clear precedent and high stakes. Your gut reaction is:",
    answers: [
      { id: "A", text: "Energised — the absence of a template means creative freedom" },
      { id: "B", text: "Cautious but engaged — I'll define the structure before I dive in" },
      { id: "C", text: "Uncomfortable — I work better with clearer parameters" },
      { id: "D", text: "Neutral — I've learned to work with whatever I'm given" },
    ],
  },
  {
    id: 4,
    question: "Your most satisfying work moments have involved:",
    answers: [
      { id: "A", text: "Solving something genuinely hard that nobody had cracked before" },
      { id: "B", text: "Executing something complex flawlessly and at pace" },
      { id: "C", text: "Helping someone else get unstuck or move faster" },
      { id: "D", text: "Delivering reliably on something I knew I could do well" },
    ],
  },
  {
    id: 5,
    question: "At the end of a genuinely productive week, what tells you it was productive?",
    answers: [
      { id: "A", text: "I made meaningful progress on something that matters long term" },
      { id: "B", text: "I cleared everything that needed to get done" },
      { id: "C", text: "I learned something or got measurably better at something" },
      { id: "D", text: "People depended on me and I came through for them" },
    ],
  },
  {
    id: 6,
    question: "Which of these feels most uncomfortably true about your work right now?",
    answers: [
      { id: "A", text: "I'm busy but I'm not growing" },
      { id: "B", text: "I have the capacity but not the challenge" },
      { id: "C", text: "I know what good looks like but can't find the conditions" },
      { id: "D", text: "I'm not sure what it would take to feel genuinely fulfilled at work" },
    ],
  },
];

export const roles = [
  { id: "builder", label: "Builder / Maker", description: "Code, design, craft" },
  { id: "advisor", label: "Advisor / Strategist", description: "Thinking, writing, consulting" },
  { id: "lead", label: "Lead / Manager", description: "Coordinating people and outcomes" },
  { id: "founder", label: "Founder / Executive", description: "Everything at once" },
  { id: "freelancer", label: "Freelancer / Independent", description: "Multiple clients or projects" },
];
