import { createServerFn } from "@tanstack/react-start";

type DeleteResult = { success: boolean; error?: string };

export const deleteInternshipApplication = createServerFn({ method: "POST" })
  .validator((d: any) => d as { applicationId: string })
  .handler(async ({ data }): Promise<DeleteResult> => {
    const { applicationId } = data;
    if (!applicationId) return { success: false, error: "Application ID is required" };

    console.log("[Admin] Deleting internship application:", applicationId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cascade = ["submissions", "payments", "certificates"] as const;
    for (const table of cascade) {
      const { error } = await supabaseAdmin.from(table).delete().eq("application_id", applicationId);
      if (error) {
        console.error(`[Admin] Failed to delete ${table}:`, error);
        return { success: false, error: `Failed to delete ${table}: ${error.message}` };
      }
    }

    const { error } = await supabaseAdmin.from("applications").delete().eq("id", applicationId);
    if (error) return { success: false, error: `Failed to delete application: ${error.message}` };

    console.log("[Admin] Application deleted successfully:", applicationId);
    return { success: true };
  });

export const deleteCourseEnrollment = createServerFn({ method: "POST" })
  .validator((d: any) => d as { enrollmentId: string })
  .handler(async ({ data }): Promise<DeleteResult> => {
    const { enrollmentId } = data;
    if (!enrollmentId) return { success: false, error: "Enrollment ID is required" };

    console.log("[Admin] Deleting course enrollment:", enrollmentId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const cascade = ["lesson_progress", "course_task_submissions", "quiz_attempts", "course_certificates", "topic_quiz_attempts"] as const;
    for (const table of cascade) {
      const { error } = await supabaseAdmin.from(table).delete().eq("enrollment_id", enrollmentId);
      if (error) {
        console.error(`[Admin] Failed to delete ${table}:`, error);
        return { success: false, error: `Failed to delete ${table}: ${error.message}` };
      }
    }

    const { error } = await supabaseAdmin.from("enrollments").delete().eq("id", enrollmentId);
    if (error) return { success: false, error: `Failed to delete enrollment: ${error.message}` };

    console.log("[Admin] Enrollment deleted successfully:", enrollmentId);
    return { success: true };
  });
