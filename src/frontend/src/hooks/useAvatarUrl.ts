import { useEffect, useState } from "react";
import type { ExternalBlob } from "../backend.d";

export function useAvatarUrl(avatar: ExternalBlob | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatar) {
      setUrl(null);
      return;
    }

    // ExternalBlob has getDirectURL() for a URL we can use directly
    try {
      const directUrl = avatar.getDirectURL();
      setUrl(directUrl);
    } catch {
      setUrl(null);
    }
  }, [avatar]);

  return url;
}
