export type WorkoutGoal =
  | "flexibility"
  | "maintenance"
  | "strength"
  | "olympic"
  | "hypertrophy";

export type WorkoutSplit =
  | "push_pull_legs"
  | "upper_lower"
  | "full_body"
  | "five_by_five"
  | "olympic_technique";

export type WorkoutExercise = {
  name: string;
  sets: string;
  reps: string;
  equipment: "barbell" | "dumbbell" | "cable" | "bodyweight";
};

export type WorkoutTemplateDay = {
  dayLabel: string;
  focus: string;
  exercises: WorkoutExercise[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string;
  goal: WorkoutGoal;
  split: WorkoutSplit;
  days: WorkoutTemplateDay[];
};

export type UserProfile = {
  id: string;
  slug: string;
  displayName: string;
  spotifyEnabled: boolean;
  templateSelectionMode: "persistent" | "session_prompt";
  defaultCity: string;
  timezone: string;
};

export type WorkoutSource = {
  id: string;
  sourceType: "google_sheet" | "template";
  publishUrl: string | null;
  editUrl: string | null;
  goal: string | null;
  split: string | null;
  templateId: string | null;
};

export type SpotifyNowPlaying = {
  linked: boolean;
  controllable: boolean;
  controlErrorCode: "no_active_device" | "premium_required" | "forbidden" | "rate_limited" | "unavailable" | null;
  controlErrorMessage: string | null;
  isPlaying: boolean;
  trackName: string | null;
  artistName: string | null;
  albumName: string | null;
  albumArtUrl: string | null;
  externalUrl: string | null;
  progressMs: number | null;
  durationMs: number | null;
};

export type WeatherSnapshot = {
  city: string;
  requestedCity: string;
  temperatureC: number;
  weatherDescription: string;
  highC: number;
  lowC: number;
};

export type SheetTab = {
  name: string;
  gid: string;
};

export type CalendarEventDto = {
  id: string;
  title: string;
  eventDate: string;
  status: "planned" | "done";
  notes: string | null;
};

export type DashboardPayload = {
  user: UserProfile;
  workoutSource: WorkoutSource | null;
  workoutTemplate: WorkoutTemplate | null;
  calendarEvents: CalendarEventDto[];
  weather: WeatherSnapshot | null;
  spotifyLinked: boolean;
};
