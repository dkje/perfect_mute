const getLiItem = ({ innerText, closeEventHandler }) => {
	const $li = document.createElement("li");
	$li.innerText = innerText;
	const $removeLiBtn = document.createElement("button");
	$removeLiBtn.innerText = "x";
	$removeLiBtn.className = "btn_sm";
	$removeLiBtn.addEventListener("click", closeEventHandler);
	$li.appendChild($removeLiBtn);
	return $li;
};

const getNoItemMsg = (text) => {
	const $message = document.createElement("span");
	$message.className = "info_text";
	$message.innerText = text;
	return $message;
};

const getStorage = async (key, cb) => {
	return cb ? chrome.storage.sync.get(key, cb) : chrome.storage.sync.get(key);
};

const setStorage = async (value, cb) => {
	return cb
		? chrome.storage.sync.set(value, cb)
		: chrome.storage.sync.set(value);
};

const KEYS = {
	BLOCK_LIST: "BLOCK_LIST",
};

(function initBlockFormSetting() {
	const addNewId = async () => {
		const { [KEYS.BLOCK_LIST]: list } = await getStorage(KEYS.BLOCK_LIST);
		$input = document.getElementById("user_id_input");
		if (!$input.value) return;
		const newList = [...new Set([...(list || []), $input.value])];
		setStorage({ [KEYS.BLOCK_LIST]: newList });
	};
	const $addBtn = document.getElementById("add_btn");
	$addBtn.addEventListener("click", addNewId);
})();

(function setClearAllBtn() {
	const clearAll = () => setStorage({ [KEYS.BLOCK_LIST]: null });
	const $clearBtn = document.getElementById("remove_all_btn");
	$clearBtn.addEventListener("click", clearAll);
})();

(function initExportImportSetting() {
	const onClickImport = () => {
		const getFileInput = (onSelectFile) => {
			const $input = document.createElement("input");
			$input.type = "file";
			$input.accept = ".json";
			$input.addEventListener("change", onSelectFile);
			return $input;
		};

		const saveWithMerge = async (importedSetting) => {
			const originals = await getStorage(null);
			const blockList = [
				...new Set([
					...(originals[KEYS.BLOCK_LIST] || []),
					...(importedSetting[KEYS.BLOCK_LIST] || []),
				]),
			];
			const result = { [KEYS.BLOCK_LIST]: blockList };
			chrome.storage.sync.set(result);
		};

		const fileHandler = async (e) => {
			const fileToJSON = (file) => {
				const reader = new FileReader();
				reader.onload = () => {
					saveWithMerge(JSON.parse(reader.result));
				};
				reader.readAsText(file);
			};
			const file = await e.target.files[0];
			fileToJSON(file);
		};

		const $input = getFileInput(fileHandler);
		$input.click();
	};

	const onClickExport = async () => {
		const getSettingFile = async () => {
			const settingData = await chrome.storage.sync.get(null);
			const blob = new Blob([JSON.stringify(settingData)], {
				type: "text/json",
			});
			return blob;
		};

		const getLinkDom = (blob, filename) => {
			const link = document.createElement("a");
			link.download = filename;
			link.href = window.URL.createObjectURL(blob);
			link.dataset.downloadurl = ["text/json", link.download, link.href].join(
				":"
			);
			return link;
		};

		const file = await getSettingFile();
		const $link = getLinkDom(file, "real_mute.json");

		$link.dispatchEvent(
			new MouseEvent("click", {
				view: window,
				bubbles: true,
				cancelable: true,
			})
		);
		$link.remove();
		alert("설정 파일이 다운로드 됐습니다");
	};

	const $exportBtn = document.getElementById("export_btn");
	$exportBtn.addEventListener("click", onClickExport);
	const $import_btn = document.getElementById("import_btn");
	$import_btn.addEventListener("click", onClickImport);
})();

(function initBlockLists() {
	const loadList = async () => {
		const { [KEYS.BLOCK_LIST]: items } = await getStorage(KEYS.BLOCK_LIST);

		const $list = document.getElementById("saved_list");
		$list.innerHTML = "";

		if (items?.length) {
			const removeItem = (id) => {
				setStorage({ [KEYS.BLOCK_LIST]: items.filter((el) => el !== id) });
			};
			const getItem = (id) => {
				return getLiItem({
					innerText: id,
					closeEventHandler: () => removeItem(id),
				});
			};
			$list.append(...items.map(getItem));
		} else {
			$list.appendChild(getNoItemMsg("no settings saved"));
		}
	};

	chrome.storage.onChanged.addListener(loadList);
	loadList();
})();
