
function $dom(obj, options = undefined) {
	if (typeof obj === "string" || obj instanceof String) {
		// Assume object of structure "name#id?(.class)*"
		let [nameAndId, ...classes] = obj.split(".")
		let [name, id] = nameAndId.split("#")

		obj = {
			...options,
			name: name != "" ? name : "div",
			id: id,
			class: classes.length != 0 ? classes : undefined,
		}
	}

	return $dom.fromObj(obj)
}

$dom.fromObj = (obj) => {
	const dom_object = {
		name: "",
		id: "",
		class: "class1 class2 ..." || ["", "", "..."],
		children: [Element, /*dom_object*/, "text", null], // null is just ignored or optionally raises an error
		attributes: {},
		events: {},

		capture: {}, // Used to capture the created element for later use
	
		/* Any other property is concidered an attribute with lower priority than attributes declared in the attributes property */
	}

	if (!obj.name) return null

	let node = document.createElement(obj.name)
	if (obj.capture) obj.capture.element = node // for later use of caller

	if (obj.id) node.id = obj.id

	if (obj.class) {
		if (typeof obj.class === "string" || obj.class instanceof String) {
			obj.class = obj.class.split(" ")
		}
		if (Array.isArray(obj.class)) {
			obj.class.forEach(e => node.classList.add(e))
		}
	}

	if (obj.events) { Object.entries(obj.events).forEach(e => node[e[0]] = e[1]) }

	Object.entries(obj).forEach(e => {
		if (dom_object[e[0]] !== undefined) return
		node.setAttribute(e[0], String(e[1]))
	})

	if (obj.attributes) { Object.entries(obj.attributes).forEach(e => node.setAttribute(e[0], String(e[1]))) }

	if (obj.children) {
		if (!Array.isArray(obj.children)) {
			obj.children = [obj.children]
		}
		obj.children.forEach(e => {
			if (e === null) {
				if ($dom.errorOnNull) {
					console.error("null children encountered", node)
				}
			}
			else if (e.ownerDocument === document) {
				// Already an element
				node.appendChild(e)
			}
			else if (typeof e === "string" || e instanceof String) {
				// Literal Text
				node.appendChild(document.createTextNode(e))
			}
			else if (typeof e === 'object' && e !== null) {
				node.appendChild($dom(e))
			}
		})
	}

	return node
}

$dom.div = (obj = {}) => $dom({...obj, name: "div"})
$dom.span = (obj = {}) => $dom({...obj, name: "span"})

$dom.errorOnNull = true

function createHtmlStructure(obj) {
	const default_obj = {
		classes: [],
		id: null,
		innerText: "",
		children: [],
		name: null,
		events: {}
	}

	obj = {...default_obj, ...obj}

	if (obj.name == "#text") {
		return document.createTextNode(obj.innerText)
	}

	let node = document.createElement(obj.name)
	if (obj.id) {
		node.id = obj.id
	}
	node.innerText = obj.innerText
	if (Array.isArray(obj.classes)) {
		obj.classes.forEach(e => {node.classList.add(e)})
	}

	for (const [key, value] of Object.entries(obj)) {
		if (default_obj[key] !== undefined) {continue}

		node.setAttribute(key, value)
	}

	for (const [key, value] of Object.entries(obj.events)) {
		node[key] = value
	}

	obj.children.forEach(e => {
		let child = createHtmlStructure(e)
		node.appendChild(child)
	})

	return node
}

function loadNodeObject(node) {
	nodeResizeObserver.disconnect()
	container.textContent = "" // To remove all old nodes

	container.appendChild(node.createDom())

	Node.createLines()

	document.querySelectorAll(":not(#container) > .node > .node-head").forEach(e => nodeResizeObserver.observe(e))

	document.querySelectorAll(".node-head .dropdown").forEach(e => {
		e.querySelector("button.material-icons.icon-button").onclick = ev => ev.target.parentElement.classList.toggle('show')
		e.querySelectorAll("div > button[data-action]").forEach(btn => btn.onclick = nodeSettingClick)
	})

	// Add Tag Buttons & New Tag text fields
	document.querySelectorAll("#add-tag-button").forEach(e => {
		e.onclick = _ => {
			// let textfield = createHtmlStructure({
			// 	name: "input", type: "text", classes: ["node-tag", "tag-text-field"]
			// })
			// textfield.onblur = _ => {
			// 	let node = Node.fromDom(textfield.closest(".node"))
			// 	if (!node) {return}

			// 	if (textfield.value != "") { node.addAttribute(textfield.value) }

			// 	textfield.remove()
			// }
			// textfield.onkeydown = ev => {
			// 	if (ev.key == "Escape") {
			// 		textfield.remove()
			// 	}
			// 	else if (ev.code == "Enter") {
			// 		textfield.blur() // Applies tag through onblur event
			// 	}
			// }
			// e.closest("#tags").appendChild(textfield)
			// textfield.focus()

			let textfield = {}
			e.closest("#tags").appendChild(
				$dom({name: "input", type: "text", class: ["node-tag", "tag-text-field"], capture: textfield,
					events: {
						onblur: ev => {
							let node = Node.fromDom(ev.target.closest(".node"))
							if (!node) {return}
			
							if (ev.target.value != "") { node.addAttribute(ev.target.value) }
			
							ev.target.remove()
						},
						onkeydown: ev => {
							if (ev.key == "Escape") {
								ev.target.remove()
							}
							else if (ev.code == "Enter") {
								ev.target.blur() // Applies tag through onblur event
							}
						}
					}
				}))
			textfield.element.focus()
		}
	})

	// Add Attribute Button
	document.querySelectorAll("#add-attr-button").forEach(e => {
		e.onclick = ev => {
			let table = ev.target.closest(".attribute-container").querySelector("#attributes-table")

			// let tableRow = createHtmlStructure({name: "tr", children: [{name: "td"}]})
			// table.appendChild(tableRow)

			// let keyDataField = createHtmlStructure({name: "td"})
			// let valueDataField = createHtmlStructure({name: "td"})
			// tableRow.appendChild(keyDataField)
			// tableRow.appendChild(valueDataField)
			// let keyField = createHtmlStructure({name: "input", type: "text", classes: ["attr-text-field"]})
			// let valueField = createHtmlStructure({name: "input", type: "text", classes: ["attr-text-field"]})
			// keyDataField.appendChild(keyField)
			// valueDataField.appendChild(valueField)

			// keyField.onblur = ev => {
			// 	// Focus was given to value, do nothing
			// 	if (valueField.isSameNode(ev.relatedTarget)) {return}

			// 	let node = Node.fromDom(keyField.closest(".node"))

			// 	if (keyField.value != "") { node.addAttribute(keyField.value, valueField.value) }

			// 	tableRow.remove()
			// }
			// keyField.onkeydown = ev => {
			// 	if (ev.key == "Escape") {
			// 		tableRow.remove()
			// 	}
			// 	else if (ev.code == "Enter") {
			// 		valueField.focus()
			// 	}
			// }

			// valueField.onblur = ev => {
			// 	// Focus was given to key, do nothing
			// 	if (keyField.isSameNode(ev.relatedTarget)) {return}

			// 	let node = Node.fromDom(valueField.closest(".node"))

			// 	if (keyField.value != "") { node.addAttribute(keyField.value, valueField.value) }

			// 	tableRow.remove()
			// }
			// valueField.onkeydown = ev => {
			// 	if (ev.key == "Escape") {
			// 		tableRow.remove()
			// 	}
			// 	else if (ev.code == "Enter") {
			// 		valueField.blur()
			// 	}
			// }

			let row = {}, keyField = {}, valueField = {}
			table.appendChild($dom(
				{name: "tr", capture: row, children: [
					{name: "td", children: {name: "input", type: "text", class: "attr-text-field", capture: keyField,
						events: {
							onblur: ev => {
								// Focus was given to value, do nothing
								if (valueField.element.isSameNode(ev.relatedTarget)) {return}
								let node = Node.fromDom(ev.target.closest(".node"))
								if (ev.target.value != "") { node.addAttribute(keyField.element.value, valueField.element.value) }
								row.element.remove()
							},

							onkeydown: ev => {
								if (ev.key == "Escape") { row.element.remove() }
								else if (ev.code == "Enter") { valueField.element.focus() }
							}
						}}},
					{name: "td", children: {name: "input", type: "text", class: "attr-text-field", capture: valueField,
						events: {
							onblur: ev => {
								// Focus was given to key, do nothing
								if (keyField.element.isSameNode(ev.relatedTarget)) {return}
								let node = Node.fromDom(valueField.element.closest(".node"))
								if (keyField.element.value != "") { node.addAttribute(keyField.element.value, valueField.element.value) }
								row.element.remove()
							},

							onkeydown: ev => {
								if (ev.key == "Escape") { row.element.remove() }
								else if (ev.code == "Enter") { valueField.element.blur() }
							}
						}}}
				]}))

			keyField.element.focus()
		}
	})

	document.querySelectorAll("#title .edit-button").forEach(e => {
		e.onclick = ev => {
			let textnode = ev.target.closest(".node").querySelector("#title-name")
			let currValue = textnode.textContent

			// let edit_field = createHtmlStructure({
			// 	name: "input", type: "text", value: currValue, classes: ["name-text-field"],
			// 	events: {
			// 		onblur: ev => {
			// 			ev.target.replaceWith(createHtmlStructure({
			// 				name: "span", id: "title-name", innerText: ev.target.value
			// 			}))
			// 		},
			// 		onkeydown: ev => {
			// 			if (ev.key == "Escape") {
			// 				ev.target.replaceWith(createHtmlStructure({
			// 					name: "span", id: "title-name", innerText: currValue
			// 				}))
			// 			}
			// 			else if (ev.code == "Enter") {
			// 				ev.target.blur() // Applies tag through onblur event
			// 			}
			// 		}
			// 	}
			// })
			let edit_field = $dom({name: "input", type: "text", value: currValue, class: "name-text-field",
				events: {
					onblur: ev => {
						ev.target.replaceWith($dom.span({id: "title-name", children: ev.target.value}))
					},
					onkeydown: ev => {
						if (ev.key == "Escape") { ev.target.replaceWith($dom.span({id: "title-name", children: currValue})) }
						else if (ev.code == "Enter") { ev.target.blur() } // Applies tag through onblur event
					}
				}
			})

			textnode.replaceWith(edit_field)
			edit_field.focus()
			edit_field.select()
		}
	})

	document.querySelectorAll("#value .edit-button").forEach(e => {
		e.onclick = ev => {
			let textnode = ev.target.closest(".node").querySelector("#value-name")

			let currValue = textnode.textContent

			// let edit_field = createHtmlStructure({
			// 	name: "input", type: "text", value: currValue, classes: ["value-text-field"],
			// 	events: {
			// 		onblur: ev => {
			// 			let node = Node.fromDom(ev.target.closest(".node"))
			// 			ev.target.replaceWith(createHtmlStructure({
			// 				name: "span", id: "value-name", innerText: ev.target.value
			// 			}))
			// 			node.updateDom()
			// 		},
			// 		onkeydown: ev => {
			// 			if (ev.key == "Escape") {
			// 				ev.target.replaceWith(createHtmlStructure({
			// 					name: "span", id: "value-name", innerText: currValue
			// 				}))
			// 			}
			// 			else if (ev.code == "Enter") {
			// 				ev.target.blur() // Applies tag through onblur event
			// 			}
			// 		}
			// 	}
			// })
			let edit_field = $dom({name: "input", type: "text", value: currValue, class: "value-text-field",
				events: {
					onblur: ev => {
						let node = Node.fromDom(ev.target.closest(".node"))
						ev.target.replaceWith($dom.span({id: "value-name", children: ev.target.value}))
						node.updateDom()
					},
					onkeydown: ev => {
						if (ev.key == "Escape") { ev.target.replaceWith($dom.span({id: "value-name", children: currValue})) }
						else if (ev.code == "Enter") { ev.target.blur() } // Applies tag through onblur event
					}
				}
			})

			textnode.replaceWith(edit_field)
			edit_field.focus()
			edit_field.select()
		}
	})
}

function loadJsonObject(obj) {
	loadNodeObject(Node.fromObject(obj))
}

function loadXmlObject(obj) {
	loadNodeObject(Node.fromTree(obj.documentElement))
}

function loadJsonString(jsonString) {
	let jsonObj = JSON.parse(jsonString)
	loadJsonObject(jsonObj)
}

function loadXmlString(xmlString) {
	let parser = new DOMParser()
	let xmlObj = parser.parseFromString(xmlString, "text/xml")

	loadXmlObject(xmlObj)
}

function selectFile(file) {
	if (Array.isArray(file)) {
		file = file.find(e => Node.supportedTypes.has(e.type))
	}

	let reader = new FileReader()
	reader.onload = () => {
		if (file.type == "application/xml" || file.type == "text/xml") {
			loadXmlString(reader.result)
		}
		else if (file.type == "application/json") {
			loadJsonString(reader.result)
		}
		else {
			alert(`Unknown file\nmime-type:${file.type}`)
			return
		}

		let filename = document.getElementById("active-file-name")
		let filetype = document.getElementById("active-file-type")

		filename.textContent = file.name
		filetype.textContent = file.type
	}
	reader.readAsText(file)
}

function nodeSettingClick(ev) {
	let elem = ev.target
	let action = elem.getAttribute("data-action")

	elem.closest(".dropdown").classList.remove("show")
	if (!action) {return}

	let elemNode = Node.fromDom(elem.closest(".node"))
	let parentNode = elemNode.parent

	switch (action) {
		case "hide-self":
			if (!parentNode) {break}
			elemNode.classList.add("hidden")
			parentNode.updateLines()

			parentNode.classList.add("filter-active")
			break;
		case "hide-siblings":
			if (!parentNode) {break}
			parentNode.children.forEach(e => {if (!elemNode._dom_object.isSameNode(e._dom_object)) {e.classList.add("hidden")}})
			parentNode.updateLines()

			parentNode.classList.add("filter-active")
			break;
		case "hide-children":
			Array.from(elemNode.children).forEach(e => e.classList.add("hidden"))
			parentNode.updateLines()

			elemNode.classList.add("filter-active")
			break;
		case "show-siblings":
			Array.from(parentNode.children).forEach(e => e.classList.remove("hidden"))
			parentNode.updateLines()

			parentNode.classList.remove("filter-active")
			break;
		case "show-children":
			Array.from(elemNode.children).forEach(e => e.classList.remove("hidden"))
			parentNode.updateLines()

			elemNode.classList.remove("filter-active")
			break;
		default: break;
	}
}

function toggle_color_theme() {
	let btn = document.getElementById("color-theme-toggle")

	switch (document.body.getAttribute("theme")) {
		case "": // To Light
			document.body.setAttribute("theme", "light")
			btn.textContent = "brightness_7"
			btn.style.setProperty("--rotation", "0")
			break
		case "light": // To Print
			document.body.setAttribute("theme", "print")
			btn.textContent = "brightness_6"
			btn.style.setProperty("--rotation", "0")
			break
		case "print": // To Dark
			document.body.setAttribute("theme", "dark")
			btn.textContent = "brightness_3"
			btn.style.setProperty("--rotation", "45deg")
			break
		case "dark": // To Default
			document.body.setAttribute("theme", "")
			btn.textContent = "brightness_4"
			btn.style.setProperty("--rotation", "45deg")
			break
	}
}

function toggle_layout(ev) {
	if (ev.target.checked && ev.target.value == "horizontal") {
		container.classList.add("horizontal")
		Node.createLines()
	}
	else {
		container.classList.remove("horizontal")
		Node.createLines()
	}
}

function dragover_handler(ev) {
	ev.preventDefault()

	document.querySelector("body").classList.add("drag")

	let status_icon = document.querySelector("#drag-overlay .material-icons")
	let information = document.querySelector("#drag-overlay #drop-information")

	let files = []

	if (ev.dataTransfer.items) {
		files = [...ev.dataTransfer.items].filter(e => e.kind == "file")
	}

	if (!files || files.length == 0) {
		status_icon.textContent = "error_outline"
		information.textContent = "Only files can be processed"
	}
	else if (files.length > 1) {
		status_icon.textContent = "info_outline"
		information.textContent = "Only one file at a time can be viewed"
	}
	else if (!Node.supportedTypes.has(files[0].type)) {
		status_icon.textContent = "error_outline"
		information.textContent = "Only files of type XML or JSON are supported"
	}
}

function drop_handler(ev) {
	ev.preventDefault()
	document.querySelector("body").classList.remove("drag")
	if (!ev.dataTransfer.items) {return}

	let files = [...ev.dataTransfer.items].filter(e => e.kind == "file").map(e => e.getAsFile())

	if (!files || files.length == 0) {return}

	let file = files.find(e => Node.supportedTypes.has(e.type))

	if (!file) {return}

	selectFile(file)
}

function save_file(data, type, name) {
	let blob = new Blob([data], {type: type})
	let download = document.getElementById("download-link")
	let prevUrl = download.getAttribute("href")
	if (prevUrl != "") { URL.revokeObjectURL(prevUrl)}
	download.href = URL.createObjectURL(blob)
	download.download = name
	download.click()
}

/* Variables */
let container = document.getElementById("container")
let settingsContainer = document.getElementById("settings")

let nodeResizeObserver = new ResizeObserver(entries => entries.forEach(e => Node.fromDom(e.target.closest(".node"))?.parent?.updateLines()))

let show_settings = visible => settingsContainer.classList.toggle("show", visible)

/* Assignments */

Node.layout = () => (container.classList.contains("horizontal") ? "horizontal" : "vertical")

document.ondragover = dragover_handler
document.ondragend = () => document.body.classList.remove("drag")
document.ondragleave = () => document.body.classList.remove("drag")
document.ondrop = drop_handler

document.querySelectorAll("label.custom-checkbox[data-container-class]").forEach(e => {
	e.querySelector("input[type='checkbox']").onchange = (ev) => document.getElementById("container").classList.toggle(e.getAttribute("data-container-class"), ev.target.checked)
})

document.querySelectorAll('input[type="radio"][name="orientation"]').forEach(e => {
	e.onclick = toggle_layout
})

document.getElementById("active-file").onchange = (ev) => selectFile([...ev.target.files])

Node.ondeletetag = ev => {
	let node = Node.fromDom(ev.target.closest(".node"))
	ev.target.closest(".node-tag").remove()
	node.updateDom()
}

Node.ondeleteattribute = ev => {
	let node = Node.fromDom(ev.target.closest(".node"))
	ev.target.closest("tr").remove()
	node.updateDom()
}

Node.oneditattribute = ev => {
	if (!container.classList.contains("edit-enable")) { return }

	let entry = ev.target.closest("tr")

	let key = entry.querySelector(".attr-key")
	let value = entry.querySelector(".attr-value")

	let keyContent = key.textContent
	let valueContent = value.textContent

	let valueField = $dom({name: "input", type: "text", value: valueContent, class: "attr-text-field",
		events: {
			onblur: ev => {
				// Focus was given to key, do nothing
				if (keyField.isSameNode(ev.relatedTarget)) {return}

				// Resolve new attribute value
				if (keyField.value == "") {
					keyField.closest("tr").remove()
				}
				else {
					key.textContent = keyField.value
					value.textContent = valueField.value
					value.className = "attr-value"
				}
			},

			onkeydown: ev => {
				if (ev.key == "Escape") {
					key.textContent = keyContent
					value.textContent = valueContent
				}
				else if (ev.code == "Enter") { valueField.blur() }
			}
		}})
	
	let keyField = $dom({name: "input", type: "text", value: keyContent, class: "attr-text-field",
		events: {
			onblur: ev => {
				// Focus was given to value, do nothing
				if (valueField.isSameNode(ev.relatedTarget)) {return}

				// Resolve new attribute value
				if (keyField.value == "") {
					keyField.closest("tr").remove()
				}
				else {
					key.textContent = keyField.value
					value.textContent = valueField.value
					value.className = "attr-value"
				}
			},

			onkeydown: ev => {
				if (ev.key == "Escape") {
					key.textContent = keyContent
					value.textContent = valueContent
				}
				else if (ev.code == "Enter") { valueField.focus() }
			}
		}})

	key.textContent = "" // Delete children
	value.textContent = "" // Delete children

	key.appendChild(keyField)
	value.appendChild(valueField)

	if (ev.target.matches(".attr-key, .attr-value")) {
		ev.target.firstElementChild.select()
	}
	else {
		keyField.select()
	}
}

Node.onedittag = ev => {
	if (!container.classList.contains("edit-enable")) { return }

	let tagContent = ev.target.textContent

	let editTag = $dom({
		name: "input", type: "text", value: tagContent, class: ["node-tag", "tag-text-field"],
		events: {
			onblur: ev => {
				ev.target.parentElement.replaceChild(
					$dom(Node.createTagStructure(ev.target.value)),
					ev.target
				)
			},
			onkeydown: ev => {
				if (ev.key == "Escape") {
					ev.target.parentElement.replaceChild(
						$dom(Node.createTagStructure(tagContent)),
						ev.target
					)	
				}
				else if (ev.code == "Enter") {
					ev.target.blur() // Applies tag through onblur event
				}
			}
		}
	})

	let tag = ev.target.closest(".node-tag")
	tag.parentElement.replaceChild(editTag, tag)
	editTag.select()
}

document.getElementById("save-to-file").onclick = _ => {
	let node = Node.fromDom(document.querySelector("#container .node"))

	if (!node) {return}

	let file_type = node.type == Node.TreeNodeType.namedObject ? "xml" : "json"
	let type = `application/${file_type}`

	let data = ""

	let errors = []

	if (file_type == "xml") {
		let serializer = new XMLSerializer()
		let {object: tree, conflicts} = node.toTree()
		data = serializer.serializeToString(tree)
		errors = conflicts
	}
	else if (file_type == "json") {
		let {object, conflicts} = node.toObject()
		data = JSON.stringify(object)
		errors = conflicts
	}

	let error_list = document.getElementById("error-box")
	error_list.textContent = "" // Delete children
	error_list.append($dom({name:"span", children: "Export Conflicts"}))
	error_list.append($dom({name:"a", href: "#", children: "Clear marking"}))

	errors.forEach((e, index) => {
		let error_tag = `error${index}`

		error_list.appendChild($dom.span({class: "error-message", children: [
			{name: "span", class: "error", children: e.error},
			" for ",
			{name: "a", href: `#${error_tag}`, children: e.for}
		]}))

		e.at._dom_object.id = error_tag
	})

	error_list.classList.toggle("hidden", errors.length == 0)

	// if (errors.length != 0) {
	// 	error_list.append($dom({name:"a", href: "#", children: "Clear marking"}))
	// }

	save_file(data, type, "tree." + file_type)
}

let slider = document.getElementById("node-gap")
slider.onchange = _ => {
	container.style.setProperty("--node-gap", `${slider.value}rem`)
	Node.createLines()
}
slider.oninput = slider.onchange
