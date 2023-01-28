const KEYS = {
	BLOCK_LIST: "BLOCK_LIST",
};

const setObserver = (targetDom, eventHandler) => {
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((records) => {
			records.addedNodes.forEach(eventHandler);
		});
	});
	observer.observe(targetDom, {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});
};

(function runMute() {
	const getItems = async () => {
		let { [KEYS.BLOCK_LIST]: items } = await chrome.storage.sync.get(
			KEYS.BLOCK_LIST
		);
		if (!Array.isArray(items)) {
			return [];
		}
		return items;
	};

	const replace = async (node) => {
		if (node.nodeName === "IFRAME") {
			const target =
				node.contentWindow.document.getElementsByTagName("body")[0];
			setObserver(target, replace);
			replace(target);
		}

		const items = await getItems();
		if (!items?.length) return;

		const matchText = items.join("|");
		const findRegex = new RegExp(matchText);
		const matched = findRegex.test(node.innerText);

		if (!matched) return;

		const findNode = (node) => {
			console.log(node);
			if (node.nodeName === "ARTICLE") {
				node.remove();
				return;
			} else if (node.childNodes.length) {
				node.childNodes.forEach((n) => findNode(n));
			}
		};

		findNode(node);
	};

	setObserver(document, replace);
})();
