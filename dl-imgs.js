// 图片打包工具 - 手动调用版
(function () {
  // 默认配置
  const DEFAULT_CONFIG = {
    selector: ".grid-scroll--O0kCz img",
    outputName: "images.zip",
    verbose: true,
  };

  let currentConfig = Object.assign({}, DEFAULT_CONFIG);

  const log = (...args) => currentConfig.verbose && console.log(...args);
  const error = (...args) => console.error(...args);

  async function loadJSZip() {
    if (typeof window.JSZip !== "undefined") {
      return window.JSZip;
    }

    console.log("正在加载 JSZip 库...");
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = () => {
        if (typeof window.JSZip !== "undefined") {
          resolve(window.JSZip);
        } else {
          reject(new Error("JSZip 加载失败"));
        }
      };
      script.onerror = () => reject(new Error("JSZip 脚本加载失败"));
      document.head.appendChild(script);
    });
  }

  async function packImages(userConfig = {}) {
    // 合并配置
    currentConfig = Object.assign({}, DEFAULT_CONFIG, userConfig);

    console.log("当前配置:", currentConfig);
    console.log(
      "提示: 可通过 window.packImages({ selector: '...', outputName: '...', verbose: true/false }) 修改配置",
    );

    try {
      // 先加载 JSZip
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      const images = document.querySelectorAll(currentConfig.selector);

      if (images.length === 0) {
        error(`未找到图片，选择器: ${currentConfig.selector}`);
        console.log(
          `💡 提示: 请检查选择器是否正确，当前页面共有 ${document.images.length} 张图片`,
        );
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

      log("正在生成 ZIP 文件...");
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = currentConfig.outputName;
      link.click();
      URL.revokeObjectURL(link.href);

      log(`🎉 完成！成功打包 ${successCount}/${images.length} 张图片`);
      console.log(`📦 下载文件: ${currentConfig.outputName}`);
    } catch (err) {
      error("打包失败:", err.message);
    }
  }

  // 挂载到 window
  window.packImages = packImages;

  // 显示使用提示
  console.log("📦 图片打包工具已加载！");
  console.log("💡 使用方法：");
  console.log("   window.packImages()  // 使用默认配置");
  console.log(
    "   window.packImages({ selector: '.my-images img', outputName: 'my-photos.zip', verbose: false })",
  );
  console.log("");
  console.log("📋 参数说明：");
  console.log("   selector  - CSS 选择器，默认: '.grid-scroll--O0kCz img'");
  console.log("   outputName - 输出文件名，默认: 'images.zip'");
  console.log("   verbose   - 是否显示详细日志，默认: true");
})();
