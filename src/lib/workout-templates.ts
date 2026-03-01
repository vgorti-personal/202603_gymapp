import type { WorkoutGoal, WorkoutSplit, WorkoutTemplate } from "@/lib/types";

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "strength-ppl-classic",
    name: "Classic Strength PPL",
    description: "Barbell-focused push, pull, legs cycle for progressive overload.",
    goal: "strength",
    split: "push_pull_legs",
    days: [
      {
        dayLabel: "Push",
        focus: "Chest, shoulders, triceps",
        exercises: [
          { name: "Barbell Bench Press", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Standing Overhead Press", sets: "4", reps: "5-6", equipment: "barbell" },
          { name: "Incline Dumbbell Press", sets: "3", reps: "8-10", equipment: "dumbbell" },
          { name: "Cable Lateral Raise", sets: "3", reps: "12-15", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Pull",
        focus: "Back and biceps",
        exercises: [
          { name: "Barbell Row", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Pull-Up", sets: "4", reps: "AMRAP", equipment: "bodyweight" },
          { name: "Cable Seated Row", sets: "3", reps: "8-12", equipment: "cable" },
          { name: "Dumbbell Hammer Curl", sets: "3", reps: "10-12", equipment: "dumbbell" },
        ],
      },
      {
        dayLabel: "Legs",
        focus: "Lower body and core",
        exercises: [
          { name: "Back Squat", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Romanian Deadlift", sets: "4", reps: "6-8", equipment: "barbell" },
          { name: "Dumbbell Walking Lunge", sets: "3", reps: "10/side", equipment: "dumbbell" },
          { name: "Hanging Knee Raise", sets: "3", reps: "12-15", equipment: "bodyweight" },
        ],
      },
    ],
  },
  {
    id: "hypertrophy-ppl-volume",
    name: "Hypertrophy PPL Volume",
    description: "Higher volume push/pull/legs focused on size and symmetry.",
    goal: "hypertrophy",
    split: "push_pull_legs",
    days: [
      {
        dayLabel: "Push",
        focus: "Chest and shoulder volume",
        exercises: [
          { name: "Dumbbell Flat Press", sets: "4", reps: "8-12", equipment: "dumbbell" },
          { name: "Cable Fly", sets: "4", reps: "12-15", equipment: "cable" },
          { name: "Seated Dumbbell Shoulder Press", sets: "3", reps: "8-12", equipment: "dumbbell" },
          { name: "Cable Triceps Pressdown", sets: "3", reps: "12-15", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Pull",
        focus: "Back width and rear delts",
        exercises: [
          { name: "Lat Pulldown (Cable)", sets: "4", reps: "8-12", equipment: "cable" },
          { name: "Single Arm Dumbbell Row", sets: "4", reps: "10-12", equipment: "dumbbell" },
          { name: "Cable Face Pull", sets: "3", reps: "15-20", equipment: "cable" },
          { name: "Incline Dumbbell Curl", sets: "3", reps: "10-12", equipment: "dumbbell" },
        ],
      },
      {
        dayLabel: "Legs",
        focus: "Quads, hamstrings, glutes",
        exercises: [
          { name: "Front Squat", sets: "4", reps: "6-8", equipment: "barbell" },
          { name: "Dumbbell Bulgarian Split Squat", sets: "3", reps: "10/side", equipment: "dumbbell" },
          { name: "Cable Pull Through", sets: "3", reps: "12-15", equipment: "cable" },
          { name: "Bodyweight Calf Raise", sets: "4", reps: "20", equipment: "bodyweight" },
        ],
      },
    ],
  },
  {
    id: "maintenance-upper-lower-a",
    name: "Maintenance Upper/Lower A",
    description: "Balanced 4-day maintenance plan with manageable weekly volume.",
    goal: "maintenance",
    split: "upper_lower",
    days: [
      {
        dayLabel: "Upper A",
        focus: "Press and pull balance",
        exercises: [
          { name: "Barbell Bench Press", sets: "3", reps: "5-8", equipment: "barbell" },
          { name: "Barbell Row", sets: "3", reps: "6-8", equipment: "barbell" },
          { name: "Cable Face Pull", sets: "3", reps: "12-15", equipment: "cable" },
          { name: "Dumbbell Curl", sets: "2", reps: "10-12", equipment: "dumbbell" },
        ],
      },
      {
        dayLabel: "Lower A",
        focus: "Squat dominant",
        exercises: [
          { name: "Back Squat", sets: "3", reps: "5-8", equipment: "barbell" },
          { name: "Romanian Deadlift", sets: "3", reps: "6-8", equipment: "barbell" },
          { name: "Dumbbell Reverse Lunge", sets: "2", reps: "10/side", equipment: "dumbbell" },
          { name: "Plank", sets: "3", reps: "45s", equipment: "bodyweight" },
        ],
      },
      {
        dayLabel: "Upper B",
        focus: "Shoulders and back",
        exercises: [
          { name: "Standing Overhead Press", sets: "3", reps: "5-8", equipment: "barbell" },
          { name: "Lat Pulldown (Cable)", sets: "3", reps: "8-10", equipment: "cable" },
          { name: "Incline Dumbbell Press", sets: "2", reps: "8-10", equipment: "dumbbell" },
          { name: "Cable Triceps Pressdown", sets: "2", reps: "12-15", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Lower B",
        focus: "Hip hinge and unilateral",
        exercises: [
          { name: "Deadlift", sets: "3", reps: "3-5", equipment: "barbell" },
          { name: "Goblet Squat", sets: "3", reps: "10-12", equipment: "dumbbell" },
          { name: "Cable Hip Abduction", sets: "2", reps: "15/side", equipment: "cable" },
          { name: "Side Plank", sets: "3", reps: "30s/side", equipment: "bodyweight" },
        ],
      },
    ],
  },
  {
    id: "maintenance-full-body-3x",
    name: "Maintenance Full Body 3x",
    description: "Three efficient workouts per week for consistency and general fitness.",
    goal: "maintenance",
    split: "full_body",
    days: [
      {
        dayLabel: "Day 1",
        focus: "Strength base",
        exercises: [
          { name: "Back Squat", sets: "4", reps: "5", equipment: "barbell" },
          { name: "Bench Press", sets: "4", reps: "5", equipment: "barbell" },
          { name: "Cable Row", sets: "3", reps: "8-10", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Day 2",
        focus: "Hinge and press",
        exercises: [
          { name: "Romanian Deadlift", sets: "4", reps: "6", equipment: "barbell" },
          { name: "Standing Overhead Press", sets: "4", reps: "6", equipment: "barbell" },
          { name: "Pull-Up", sets: "3", reps: "AMRAP", equipment: "bodyweight" },
        ],
      },
      {
        dayLabel: "Day 3",
        focus: "Unilateral and accessory",
        exercises: [
          { name: "Dumbbell Split Squat", sets: "3", reps: "10/side", equipment: "dumbbell" },
          { name: "Incline Dumbbell Press", sets: "3", reps: "10", equipment: "dumbbell" },
          { name: "Cable Face Pull", sets: "3", reps: "15", equipment: "cable" },
        ],
      },
    ],
  },
  {
    id: "olympic-technique-starter",
    name: "Olympic Technique Starter",
    description: "Skill-oriented Olympic lifting with manageable strength accessories.",
    goal: "olympic",
    split: "olympic_technique",
    days: [
      {
        dayLabel: "Snatch Day",
        focus: "Snatch mechanics",
        exercises: [
          { name: "Snatch Pull", sets: "5", reps: "3", equipment: "barbell" },
          { name: "Hang Power Snatch", sets: "6", reps: "2", equipment: "barbell" },
          { name: "Overhead Squat", sets: "4", reps: "3", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Clean & Jerk Day",
        focus: "Clean and jerk timing",
        exercises: [
          { name: "Clean Pull", sets: "5", reps: "3", equipment: "barbell" },
          { name: "Power Clean + Push Jerk", sets: "6", reps: "1+1", equipment: "barbell" },
          { name: "Front Squat", sets: "4", reps: "3", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Strength Support",
        focus: "Accessory strength",
        exercises: [
          { name: "Back Squat", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Romanian Deadlift", sets: "4", reps: "6", equipment: "barbell" },
          { name: "Cable Pallof Press", sets: "3", reps: "12/side", equipment: "cable" },
        ],
      },
    ],
  },
  {
    id: "olympic-five-day-lite",
    name: "Olympic Five Day Lite",
    description: "Frequent but moderate Olympic workouts suitable for home gym setups.",
    goal: "olympic",
    split: "full_body",
    days: [
      {
        dayLabel: "Day 1",
        focus: "Snatch emphasis",
        exercises: [
          { name: "Power Snatch", sets: "6", reps: "2", equipment: "barbell" },
          { name: "Snatch Balance", sets: "4", reps: "2", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Day 2",
        focus: "Clean emphasis",
        exercises: [
          { name: "Power Clean", sets: "6", reps: "2", equipment: "barbell" },
          { name: "Front Squat", sets: "4", reps: "3", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Day 3",
        focus: "Pulling strength",
        exercises: [
          { name: "Clean Deadlift", sets: "4", reps: "4", equipment: "barbell" },
          { name: "Barbell Row", sets: "4", reps: "6", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Day 4",
        focus: "Jerk and overhead",
        exercises: [
          { name: "Push Jerk", sets: "5", reps: "2", equipment: "barbell" },
          { name: "Strict Press", sets: "4", reps: "5", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Day 5",
        focus: "Recovery movement",
        exercises: [
          { name: "Bodyweight Reverse Lunge", sets: "3", reps: "12/side", equipment: "bodyweight" },
          { name: "Cable Face Pull", sets: "3", reps: "15", equipment: "cable" },
        ],
      },
    ],
  },
  {
    id: "five-by-five-linear",
    name: "5x5 Linear Strength",
    description: "Classic five by five strength progression for core compound lifts.",
    goal: "strength",
    split: "five_by_five",
    days: [
      {
        dayLabel: "Workout A",
        focus: "Squat and horizontal press",
        exercises: [
          { name: "Back Squat", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Bench Press", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Barbell Row", sets: "5", reps: "5", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Workout B",
        focus: "Squat and vertical press",
        exercises: [
          { name: "Back Squat", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Standing Overhead Press", sets: "5", reps: "5", equipment: "barbell" },
          { name: "Deadlift", sets: "1", reps: "5", equipment: "barbell" },
        ],
      },
    ],
  },
  {
    id: "flexibility-foundation",
    name: "Flexibility Foundation",
    description: "Mobility-forward plan with light resistance and bodyweight focus.",
    goal: "flexibility",
    split: "full_body",
    days: [
      {
        dayLabel: "Mobility A",
        focus: "Hips and thoracic spine",
        exercises: [
          { name: "Bodyweight Cossack Squat", sets: "3", reps: "8/side", equipment: "bodyweight" },
          { name: "Dumbbell Romanian Deadlift", sets: "3", reps: "10", equipment: "dumbbell" },
          { name: "Cable Woodchop", sets: "3", reps: "12/side", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Mobility B",
        focus: "Shoulders and core",
        exercises: [
          { name: "Bodyweight Pike Push-Up", sets: "3", reps: "6-10", equipment: "bodyweight" },
          { name: "Dumbbell Pullover", sets: "3", reps: "10-12", equipment: "dumbbell" },
          { name: "Cable External Rotation", sets: "3", reps: "12/side", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Mobility C",
        focus: "Full body flow",
        exercises: [
          { name: "Bodyweight Reverse Lunge", sets: "3", reps: "10/side", equipment: "bodyweight" },
          { name: "Goblet Squat Hold", sets: "3", reps: "45s", equipment: "dumbbell" },
          { name: "Plank to Down Dog", sets: "3", reps: "8", equipment: "bodyweight" },
        ],
      },
    ],
  },
  {
    id: "flexibility-maintenance-mix",
    name: "Flexibility + Strength Mix",
    description: "Blends mobility and moderate strength for joint-friendly progress.",
    goal: "flexibility",
    split: "upper_lower",
    days: [
      {
        dayLabel: "Upper Mobility",
        focus: "Shoulder health",
        exercises: [
          { name: "Dumbbell Arnold Press", sets: "3", reps: "10", equipment: "dumbbell" },
          { name: "Cable Face Pull", sets: "4", reps: "15", equipment: "cable" },
          { name: "Bodyweight Scap Push-Up", sets: "3", reps: "12", equipment: "bodyweight" },
        ],
      },
      {
        dayLabel: "Lower Mobility",
        focus: "Hip and ankle range",
        exercises: [
          { name: "Front Squat", sets: "3", reps: "6", equipment: "barbell" },
          { name: "Bodyweight Single-Leg RDL", sets: "3", reps: "10/side", equipment: "bodyweight" },
          { name: "Dumbbell Step-Up", sets: "3", reps: "10/side", equipment: "dumbbell" },
        ],
      },
    ],
  },
  {
    id: "hypertrophy-upper-lower",
    name: "Hypertrophy Upper/Lower",
    description: "Muscle-building plan with balanced upper/lower frequency.",
    goal: "hypertrophy",
    split: "upper_lower",
    days: [
      {
        dayLabel: "Upper",
        focus: "Chest/back volume",
        exercises: [
          { name: "Incline Barbell Bench", sets: "4", reps: "6-8", equipment: "barbell" },
          { name: "Single Arm Cable Row", sets: "4", reps: "10-12", equipment: "cable" },
          { name: "Dumbbell Lateral Raise", sets: "3", reps: "15", equipment: "dumbbell" },
        ],
      },
      {
        dayLabel: "Lower",
        focus: "Leg hypertrophy",
        exercises: [
          { name: "Back Squat", sets: "4", reps: "8", equipment: "barbell" },
          { name: "Dumbbell RDL", sets: "4", reps: "10", equipment: "dumbbell" },
          { name: "Cable Kickback", sets: "3", reps: "15/side", equipment: "cable" },
        ],
      },
    ],
  },
  {
    id: "strength-full-body-4x",
    name: "Strength Full Body 4x",
    description: "Four-day strength split when you want frequent heavy practice.",
    goal: "strength",
    split: "full_body",
    days: [
      {
        dayLabel: "Day 1",
        focus: "Heavy squat",
        exercises: [
          { name: "Back Squat", sets: "5", reps: "3", equipment: "barbell" },
          { name: "Bench Press", sets: "4", reps: "4", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Day 2",
        focus: "Heavy pull",
        exercises: [
          { name: "Deadlift", sets: "5", reps: "2", equipment: "barbell" },
          { name: "Standing Overhead Press", sets: "4", reps: "4", equipment: "barbell" },
        ],
      },
      {
        dayLabel: "Day 3",
        focus: "Volume squat",
        exercises: [
          { name: "Front Squat", sets: "4", reps: "5", equipment: "barbell" },
          { name: "Pull-Up", sets: "4", reps: "AMRAP", equipment: "bodyweight" },
        ],
      },
      {
        dayLabel: "Day 4",
        focus: "Volume upper",
        exercises: [
          { name: "Close Grip Bench", sets: "4", reps: "6", equipment: "barbell" },
          { name: "Barbell Row", sets: "4", reps: "6", equipment: "barbell" },
        ],
      },
    ],
  },
  {
    id: "maintenance-ppl-lite",
    name: "Maintenance PPL Lite",
    description: "Lower fatigue push pull legs plan ideal for busy weeks.",
    goal: "maintenance",
    split: "push_pull_legs",
    days: [
      {
        dayLabel: "Push",
        focus: "Efficient upper pressing",
        exercises: [
          { name: "Dumbbell Bench Press", sets: "3", reps: "8", equipment: "dumbbell" },
          { name: "Cable Shoulder Press", sets: "3", reps: "10", equipment: "cable" },
        ],
      },
      {
        dayLabel: "Pull",
        focus: "Efficient upper pulling",
        exercises: [
          { name: "Cable Lat Pulldown", sets: "3", reps: "10", equipment: "cable" },
          { name: "Dumbbell Row", sets: "3", reps: "10", equipment: "dumbbell" },
        ],
      },
      {
        dayLabel: "Legs",
        focus: "Simple lower day",
        exercises: [
          { name: "Goblet Squat", sets: "3", reps: "12", equipment: "dumbbell" },
          { name: "Bodyweight Glute Bridge", sets: "3", reps: "20", equipment: "bodyweight" },
        ],
      },
    ],
  },
];

export const WORKOUT_GOALS: WorkoutGoal[] = [
  "flexibility",
  "maintenance",
  "strength",
  "olympic",
  "hypertrophy",
];

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  "push_pull_legs",
  "upper_lower",
  "full_body",
  "five_by_five",
  "olympic_technique",
];

export function getTemplateById(templateId: string | null | undefined) {
  if (!templateId) {
    return null;
  }
  return WORKOUT_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function filterTemplates(goal?: string | null, split?: string | null) {
  return WORKOUT_TEMPLATES.filter((template) => {
    const goalMatches = goal ? template.goal === goal : true;
    const splitMatches = split ? template.split === split : true;
    return goalMatches && splitMatches;
  });
}
