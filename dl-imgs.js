// 图片打包工具 - 简化版
(function () {
  // 默认配置
  const DEFAULT_CONFIG = {
    selector: ".grid-scroll--O0kCz img", // 图片选择器
    outputName: "images.zip", // 输出文件名
    verbose: true, // 是否显示日志
  };

  // 合并用户配置
  const CONFIG = window.__ZIP_CONFIG__
    ? Object.assign({}, DEFAULT_CONFIG, window.__ZIP_CONFIG__)
    : DEFAULT_CONFIG;

  const log = (...args) => CONFIG.verbose && console.log(...args);
  const error = (...args) => console.error(...args);

  async function packImages() {
    // 加载 JSZip
    if (typeof JSZip === "undefined") {
      log("正在加载 JSZip 库...");
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("JSZip 加载失败"));
        document.head.appendChild(script);
      });
    }

    const JSZip = window.JSZip;
    const zip = new JSZip();
    const images = document.querySelectorAll(CONFIG.selector);

    if (images.length === 0) {
      error(`未找到图片，选择器: ${CONFIG.selector}`);
      return;
    }

    log(`找到 ${images.length} 张图片，开始打包...`);

    let successCount = 0;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      let src = img.src || img.getAttribute("data-src");

      if (src && src.startsWith("http")) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();

          // 确定文件扩展名
          let ext = ".jpg";
          if (blob.type.includes("png")) ext = ".png";
          if (blob.type.includes("gif")) ext = ".gif";
          if (blob.type.includes("webp")) ext = ".webp";

          zip.file(`${String(i + 1).padStart(3, "0")}${ext}`, blob);
          successCount++;
          log(`✓ 已添加 [${successCount}/${images.length}]`);
        } catch (err) {
          error(`✗ 添加失败 [${i + 1}]:`, err);
        }
      }
    }

    if (successCount === 0) {
      error("没有成功打包任何图片");
      return;
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = CONFIG.outputName;
    link.click();
    URL.revokeObjectURL(link.href);

    log(`完成！成功打包 ${successCount}/${images.length} 张图片`);
  }

  packImages().catch((err) => error("打包失败:", err));
})();
