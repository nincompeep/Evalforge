from typing import Dict, Any, Optional
import logging
from app.config import settings

logger = logging.getLogger("evalforge.observability")

class LangfuseTracker:
    def __init__(self):
        self.public_key = settings.LANGFUSE_PUBLIC_KEY
        self.secret_key = settings.LANGFUSE_SECRET_KEY
        self.host = settings.LANGFUSE_HOST
        self.enabled = bool(self.public_key and self.secret_key)
        self.client = None

        if self.enabled:
            try:
                from langfuse import Langfuse
                self.client = Langfuse(
                    public_key=self.public_key,
                    secret_key=self.secret_key,
                    host=self.host
                )
                logger.info("Langfuse observability client initialized.")
            except Exception as e:
                logger.warning(f"Could not initialize Langfuse: {e}")
                self.enabled = False

    def log_run(self, run_id: str, experiment_name: str, metrics: Dict[str, Any]):
        if not self.enabled or not self.client:
            logger.info(f"[Observability Mock Trace] Run '{run_id}' ({experiment_name}) -> {metrics}")
            return

        try:
            trace = self.client.trace(
                name=f"eval_run_{experiment_name}",
                id=run_id,
                metadata=metrics
            )
            logger.info(f"Trace logged to Langfuse: {run_id}")
        except Exception as e:
            logger.error(f"Error sending trace to Langfuse: {e}")

tracker = LangfuseTracker()
