import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
} from "@/lib/demoRecordsApi";
import {
  createDemoTask,
  deleteDemoTask,
  loadDemoTasks,
  mapDemoTaskCreateBody,
  mapDemoTaskUpdateBody,
  updateDemoTask,
} from "@/lib/demoTasksApi";

export async function GET() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const { data, error } = await loadDemoTasks();

    if (error) {
      return jsonError(`Supabase task load failed: ${error.message}`, 500);
    }

    return Response.json({
      ok: true,
      tasks: data ?? [],
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}

export async function POST(request: Request) {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const task = mapDemoTaskCreateBody(body);

  if (task instanceof Response) {
    return task;
  }

  try {
    const { data, error } = await createDemoTask(task);

    if (error) {
      return jsonError(`Supabase task create failed: ${error.message}`, 500);
    }

    return Response.json({
      ok: true,
      task: data,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}

export async function PATCH(request: Request) {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("A task id is required.", 400);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const updates = mapDemoTaskUpdateBody(body);

  if (updates instanceof Response) {
    return updates;
  }

  try {
    const { data, error } = await updateDemoTask(id, updates);

    if (error) {
      return jsonError(`Supabase task update failed: ${error.message}`, 500);
    }

    if (!data) {
      return jsonError("Task not found.", 404);
    }

    return Response.json({
      ok: true,
      task: data,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}

export async function DELETE(request: Request) {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("A task id is required.", 400);
  }

  try {
    const { error } = await deleteDemoTask(id);

    if (error) {
      return jsonError(`Supabase task delete failed: ${error.message}`, 500);
    }

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
