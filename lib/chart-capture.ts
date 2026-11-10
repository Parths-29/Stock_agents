export async function captureChart(): Promise<string> {
  const svg = document.querySelector<SVGSVGElement>("#market-price-chart");
  if (!svg)
    throw new Error("Wait for the chart to load before running vision.");
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1000");
  clone.setAttribute("height", "400");
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml;charset=utf-8",
    }),
    url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Chart capture failed."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.fillStyle = "#0D1B2A";
    ctx.fillRect(0, 0, 1000, 400);
    ctx.drawImage(img, 0, 0, 1000, 400);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
