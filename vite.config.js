import { createVuePlugin } from "vite-plugin-vue2";
import stylelitPlugin from "vite-plugin-stylelint";
import { splitVendorChunkPlugin } from "vite";
// 配置@别名
import { resolve } from "path";

// 引入多页面配置文件
const project = require("./scripts/multiPages.json");
// 获取npm run dev后缀 配置的环境变量
const npm_config_page = process.env.npm_config_page || "";
let filterProjects = [];
if (npm_config_page) {
	//如果指定了单页面打包，过滤出这个页面的配置项
	filterProjects = project.filter((ele) => {
		return ele.chunk.toLowerCase() === npm_config_page.toLowerCase();
	});
	console.log(`--------单独构建：${filterProjects[0]["chunkName"]}--------`);
} else {
	filterProjects = project;
	console.log(`--------全部构建：${filterProjects[0]["chunkName"]}--------`);
}

const getEntryPath = (p) => {
	const pages = {};
	p.forEach((ele) => {
		const htmlUrl = resolve(__dirname, `src/pages/${ele.chunk}/index.html`);
		pages[ele.chunk] = htmlUrl;
	});
	return pages;
};

export default {
	root: "./src/pages/",
	envDir: resolve(__dirname),
	plugins: [createVuePlugin(), stylelitPlugin(), splitVendorChunkPlugin()],
	// ↓解析配置
	resolve: {
		// ↓import引入忽略文件的后缀名
		extensions: [".js", ".jsx", ".json", ".vue"],
		// ↓路径别名
		alias: {
			"@": resolve(__dirname, "./src"),
			"@pages": resolve(__dirname, "./src/pages"),
		},
	},
	server: {
		host: "0.0.0.0", // 如果将此设置为 0.0.0.0 或者 true 将监听所有地址，包括局域网和公网地址。
		port: 4000, // 设置服务启动端口号，如果端口已经被使用，Vite 会自动尝试下一个可用的端口
		https: false, // 是否开启https
		open: true, // boolean | string 设置服务启动时是否自动打开浏览器，当此值为字符串时，会被用作 URL 的路径名
		cors: true, // 为开发服务器配置 CORS，配置为允许跨域
		// 设置代理，根据我们项目实际情况配置
		proxy: {
			"/api": {
				target: "http://127.0.0.1:8000", // 后台服务地址
				changeOrigin: true, // 是否允许不同源
				secure: false, // 支持https
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
	build: {
		sourcemap: false, // 这个生产环境一定要关闭，不然打包的产物会很大
		assetsInlineLimit: 4096, //小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求
		emptyOutDir: true, //Vite 会在构建时清空该目录
		rollupOptions: {
			input: getEntryPath(filterProjects),
			output: {
				compact: true, //压缩代码，删除换行符等
				assetFileNames: "[ext]/[name]-[hash].[ext]", //静态文件输出的文件夹名称
				chunkFileNames: "js/[name]-[hash].js", //chunk包输出的文件夹名称
				entryFileNames: "js/[name]-[hash].js", //入口文件输出的文件夹名称
			},
		},
		outDir: resolve(__dirname, "dist"), // 指定输出路径
	},
};
