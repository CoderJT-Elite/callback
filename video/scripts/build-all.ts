import { align } from "./align";
import { buildIndex } from "./build-index";

// Re-lines the recording (if any) with the script and rewrites index.html, without rendering.
align();
buildIndex();
