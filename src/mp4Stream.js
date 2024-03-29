import { Readable } from "stream";
import fetch from "node-fetch";
import cliProgress from "cli-progress";
import colors from "colors";

import { cookie } from "./cookie.js";

export class Mp4Stream extends Readable {
  constructor(url) {
    super();
    this.url = url;
    this.bytesDownloaded = 0;
    this.contentLength = 0;
    this.isRunning = false;
  };

async _read() {
  if (this.isRunning) return;

  this.isRunning = true;

  try {
    const response = await fetch(this.url, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,pl-PL;q=0.8,pl;q=0.7",
        range: "bytes=0-",
        referer: "https://vider.info/",
        "sec-fetch-dest": "video",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "same-site",
        cookie,
      },
    });

    this.contentLength = Number(response.headers.get("Content-Length"));

    const bar = new cliProgress.SingleBar({
      etaBuffer: 1000,
      format: `Downloading ${colors.cyan("{bar}")}| ${colors.red("{percentage}%")} || ${colors.yellow("Time: {eta}s")}`,
      hideCursor: true,
    }, cliProgress.Presets.shades_classic);

    bar.start(100,0);
    bar.setTotal((this.contentLength));

    response.body.on("data", (data) => {
      this.bytesDownloaded += data.length;
      this.push(data);

      bar.update((this.bytesDownloaded));

      if (this.contentLength === this.bytesDownloaded) bar.stop();
    });

    response.body.on("close", () => {
      this.push(null);
    });
  } catch (e) {
    this.destroy(e);
  }
}
}
