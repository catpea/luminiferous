
  class Signal {
  name = "Signal";
  #id;
  #value;
  #test;
  #same;
  #subscribers;

  // NOTE: Re: test=v=>!v==undefined... null and undefined are considered equal when using the loose equality operator

  constructor(value, same = (a, b) => a == b, test = (v) => v !== undefined) {
    this.#value = value;
    this.#test = test;
    this.#same = same;
    this.#subscribers = new Set();
  }

  get() {
    return this.value;
  }
  set(v) {
    this.value = v;
  }

  get id() {
    if (!this.#id) this.#id = rid();
    return this.#id;
  }

  get value() {
    return this.#value;
  }

  set value(newValue) {
    if (this.#same(this.#value, newValue)) return;
    this.#value = newValue;
    this.notify();
  }

  subscribe(subscriber) {
    if (this.#test(this.#value)) subscriber(this.#value);
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }

  notify() {
    for (const subscriber of this.#subscribers) subscriber(this.#value);
  }
}





class Record {
  //TODO: convert to dynamic getters to save CPU cycles

  #id; // internal id, rely on database
  content; // payload, strings, objects, signals...
  unsubscribe = []; // functions to execute on destroy

  isTemplateVariable = true; // all records are template variables
  isTemplateChunk = false; // records are not template chunks, those are the partial HTML bits mangled by Template Literals (Template Strings)

  constructor(id, content, intelligence) {
    this.#id = id;
    this.content = content;

    // context analysis/data
    if (typeof intelligence === "string") Object.assign(this, decodeAttribute(intelligence));
    if (typeof intelligence === "object") Object.assign(this, intelligence);

    // dynamic content classification

    console.log('this.type', this.type);
  }

  get type() {
    // TODO: cache this relative to .content

    if (this.content === null) return "null";
    if (this.content === undefined) return "undefined";

    const primitiveType = typeof this.content;
    if (primitiveType !== "object") {
      return primitiveType;
    }

    // Handle built-in objects and user-defined classes
    if (Array.isArray(this.content)) return "Array";

    // Try to get the constructor name
    if (this.content.constructor && this.content.constructor.name) {
      return this.content.constructor.name;
    }

    // Fallback for objects without a constructor
    return Object.prototype.toString.call(this.content).slice(8, -1);
  }

  get isSignalType() {
    return this.type === "Signal";
  }

  get isObjectType() {
    return this.type === "Object";
  }

  get isFunctionType() {
    return this.type === "function";
  }

  get isNullType() {
    return this.type === "null";
  }

  get isUndefinedType() {
    return this.type === "undefined";
  }

  get isStringType() {
    return this.type === "string";
  }

  get isNumberType() {
    return this.type === "number";
  }

  get isArrayType() {
    return this.type === "Array";
  }



  get isDocumentFragmentType() {
    return this.type === "DocumentFragment";
  }
  get isNodeListType() {
    return this.content instanceof NodeList;
  }
  get isHTMLCollectionType() {
    return this.content instanceof HTMLCollection;
  }
  get isNodeType() {
    return this.content instanceof Node;
  }

  get isElements(){
    return this.isDocumentFragmentType || this.isNodeListType || this.isHTMLCollectionType || this.isNodeType;
  }

  get isContentIterable() {
    return this.content != null && typeof this.content !== "string" && typeof this.content[Symbol.iterator] === 'function';
  }


  *[Symbol.iterator]() {
    //NOTE: full control over content iteration
    for (let item of this.isContentIterable?this.content:[this.content]) {
      yield item;
    }

  }

} // Record

function html({ raw: strings }, ...values) {
  // PHASE 1: Initialize Data || Create Information Stream & Value Database
  const [stream, database] = createStream(strings, values);
  console.table([...database.values()]);

  // PHASE 2: Create Intermediate HTML and Inject Into DOM || HTML With Markers
  const htmlString = createIntermediateHtml(stream, database);
  console.log(htmlString);
  const template = document.createElement("template");
  template.innerHTML = htmlString;
  const node = document.importNode(template.content, true);

  // PHASE 3: Upgrade Intermediate Attributes || Live Attributes
  interpolateAttributes(node, database);

  // PHASE 4: Upgrade Intermediate Nodes (Comment Nodes) || Node Import
  interpolateNodes(node, database);

  // Create Unsubscribe
  node.unsubscribe = () => [...database.values()] .filter((o) => o.isTemplateVariable) .filter((o) => o.unsubscribe.length > 0) .map((o) => o.unsubscribe) .flat() .map((bye) => bye());
  return node;
}

function createStream(strings, values) {
  const stream = [];
  const database = new Map();
  for (const [index, string] of strings.entries()) {
    const content = values[index];

    // log the raw string in correct sequence
    stream.push({ isTemplateChunk: true, content: string });

    if (content === undefined) continue;

    // store a record in the records database, this helps with subscription management, state, and debugging
    const recordId = "::" + index;
    database.set(recordId, new Record(recordId, content, string));

    // keep the record reference in the stream
    // This is a consistency kludge: we want to keep records in the database, and references in the stream. There will be more records to add to the database than what we find here, but we must still keep value references in order.
    stream.push({ isReference: true, id: recordId });
  }
  return [stream, database];
}

function decodeAttribute(htmlStr) {
  const normalizedCharacterTokens = htmlStr.trim().replace(/['"]$/,'').split(/\s+/).pop();
  const bracketCycle = htmlStr.trim().split(/[^<>]/).filter((o) => o);

  if (normalizedCharacterTokens.endsWith("=")) {

    const attributeName = normalizedCharacterTokens.substr(0, normalizedCharacterTokens.length - 1);
    const capitalizedName = String(attributeName).charAt(0).toUpperCase() + String(attributeName).slice(1);
    const isAttributeValueAssignment = true;
    return {
      attributeName,
      isAttributeValueAssignment,
      ["is" + capitalizedName + "Attribute"]: true,
    };
  } else if (bracketCycle.at(-1) == "<") {
    const isAttributeDomain = true;
    return { isAttributeDomain };
  } else {
    return {
      isElementDomain: true,
    };
  }
}

function createIntermediateHtml(stream, database) {
  const result = [];

  for (const entry of stream) {
    // Dereference
    // NOTE: Raw html strings that are part of HTML are just strings and do not need dereferencing, Local Database Records/variables, there will bemore of them than are mentioned in the code, if HTML references an object, we will add properties of that object to the database
    const fragment = entry.isReference ? database.get(entry.id) : entry;


    // Primary
    const { isTemplateChunk, isTemplateVariable } = fragment;
    // Secondary
    const { isAttributeValueAssignment, isAttributeDomain, isElementDomain } = fragment;

    console.log(fragment, isTemplateChunk, isTemplateVariable);

    // Soecial markers to process when HTML becomes a Document
    if (isTemplateChunk) {
      // Just output the HTML
      result.push(fragment.content);
    } else if (isTemplateVariable && isAttributeValueAssignment) {
      result.push(entry.id);
    } else if (isTemplateVariable && isAttributeDomain) {
      result.push(entry.id + '=""');
    } else if (isTemplateVariable && isElementDomain) {
      result.push("<!--" + entry.id + "-->");
    }
  }

  ////console.dir(result)
  return result.join("");
}

function interpolateAttributes(root, database) {
  let nodeFilter = undefined; // A callback function or an object with an acceptNode() method, which returns NodeFilter.FILTER_ACCEPT, NodeFilter.FILTER_REJECT, or NodeFilter.FILTER_SKIP.

  const elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, nodeFilter);

  while (elementWalker.nextNode()) {
    for (const attribute of elementWalker.currentNode.attributes) {
      // Gather attributes for injection
      // NOTE: attributes are injected from two sites
      const attributeList = [];

      // ::4=""
      if (attribute.name.startsWith("::")) {
        const packet = database.get(attribute.name);
        for (const [attributeName, content] of Object.entries(packet.content)) {
          //NOTE: here the name is the object property
          const capitalizedName = String(attributeName).charAt(0).toUpperCase() + String(attributeName).slice(1);
          const recordId = attribute.name + "-" + attributeName;
          const intelligence = { isAttributeValueAssignment: true, ["is" + capitalizedName + "Attribute"]: true };
          const attributePayload = new Record(recordId, content, intelligence);
          database.set(recordId, attributePayload);
          attributeList.push({ attributeName, attributePayload });
        }
        // Remove the [now malformed] marker as we will apply separate values
        elementWalker.currentNode.attributes.removeNamedItem(attribute.name);
      }

      console.info(attributeList);

      // color="::6"
      // NOTE: Here the attributeName is set by node attribute that startsWith("::")
      if (attribute.value.startsWith("::")) {
        const attributeName = attribute.name;
        const recordId = attribute.value;
        const attributePayload = database.get(recordId);
        if(!attributePayload) throw new Error(`Record id recordId="${recordId}" was not found in the database.`)

        // if (attributePayload.isArrayType && attributePayload.isClassAttribute) {



        // }else{
          attributeList.push({ attributeName, attributePayload });
        // }



        elementWalker.currentNode.attributes.removeNamedItem(attribute.name); // remove the signal installation triggering attribute
      }

      for (const { attributeName, attributePayload: record } of attributeList) {
        // NOTE: Required because elementWalker will keep updating...
        const currentNode = elementWalker.currentNode;

        if (record.isSignalType && record.isStyleAttribute) {
          const signal = record.content;
          const unsubscribe = signal.subscribe((v) => {
            for (const [cssProperty, cssValue] of Object.entries(v)) {
              if (cssValue.subscribe) {
                const unsubscribe = cssValue.subscribe((v) => (currentNode.style[cssProperty] = v));
                record.unsubscribe.push(unsubscribe);
              } else {
                // not a signal
                currentNode.style[cssProperty] = cssValue;
              }
            }
          });
          record.unsubscribe.push(unsubscribe);

        } else if ( record.isClassAttribute && record.isArrayType) {

            for (const item of  record) {
              if(item.subscribe){

                // tracking the state of classes, it is bound to the signal
                currentNode.user_currentState = new Set();

                const unsubscribe = item.subscribe((v) => {
                  const expectedState = classes(v);
                  let remove = currentNode.user_currentState.difference(expectedState);
                  let add = expectedState.difference(currentNode.user_currentState);
                  currentNode.classList.remove(...remove);
                  currentNode.classList.add(...add);
                  currentNode.user_currentState = expectedState;
                });

                record.unsubscribe.push(unsubscribe);

              }else{
                currentNode.classList.add(item);
                ;
              }
            }

        } else if (record.isSignalType) {
          // NOTE: Signals are a special case as they require a subscription
          const signal = record.content;

          const unsubscribe = signal.subscribe((v) => currentNode.setAttribute(attributeName, v));
          record.unsubscribe.push(unsubscribe);
        } else if (record.isObjectType && record.isStyleAttribute) {
          // NOTE: Styles are super special case as they require special handling
          for (const [cssProperty, cssValue] of Object.entries(record.content)) {
            currentNode.style[cssProperty] = cssValue;
          }




        } else if (record.isObjectType) {
          // NOTE: Styles are super special case as they require special handling
          for (const [eventName, eventHandler] of Object.entries(record.content).filter(([a,b])=>typeof b === 'function')) {
            currentNode[eventName] = eventHandler;
          }

        } else if (record.isFunctionType) {
          // NOTE: Functions are a special case because the node attribute must be removed, since we are adding a method
          currentNode[attributeName] = record.content;

          // TODO: Cover other cases, but without using generic/reusable functions, approach this on case by case basis.
        } else if (record.isStringType) {
          // NOTE: Example of how simple things work * example of how to add support for other objects
          currentNode.setAttribute(attributeName, record.content);
        } else if (record.isNumberType) {
          // NOTE: Example of how simple things work
          currentNode.setAttribute(attributeName, String(record.content));
        } else {
          // allow plain old value coercion
          currentNode.setAttribute(attributeName, record.content);
        }
      }
    }
  }
}

function interpolateNodes(root, database) {
  let nodeFilter = undefined; // A callback function or an object with an acceptNode() method, which returns NodeFilter.FILTER_ACCEPT, NodeFilter.FILTER_REJECT, or NodeFilter.FILTER_SKIP.

  //IMPROVEMENT: Using NodeFilter and filter
  const commentWalker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, node=>node.data.startsWith('::')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP);
  const nodesToRemove = [];

  while (commentWalker.nextNode()) {
    const currentNode = commentWalker.currentNode;

      // NOTE: we have arrived at a comment node <!--::69-->
      // WARN: upon adding nodes after <!--::69--> marker node, the marker node needs to be removed as the spot can be considered interpolated
      // NOTE: nodesToRemove runs after the treeWalker cycle is complete
      nodesToRemove.push(currentNode);

      // NOTE: Node Accumulator Pattern * store nodes that are meant to be inserted after the CURRENT Comment Node ie: <!--::69-->
      // IMPROVEMENT: using a nodesToImport accumulator
      const nodesToImport = [];

      const record = database.get(currentNode.data);
      //INFO: record.content holds the data that was assigned in Template Literals (Template Strings)

      // IMPROVEMENT: we are baling out of this function, to give ourselves the ability to call nodeImporter from within nodeImporter for recursive operations (if any)
      nodeImporter(nodesToImport, record);

      // NOTE: Adding The Accumulated Nodes
      // IMPROVEMENT: using .after which inserts spread-nodesToImport-objects in the children list of the currentNode's parent, just after the currentNode
      // NOTE: because we are using nodesToImport accumulator we can just use .after with spread operator "..."
      currentNode.after(...nodesToImport);
      // Issue a freiendly warning
      if(nodesToImport.length === 0) console.warn(`Warning! no new Nodes were added to ${currentNode.data}`)

    } // walker


    /*
    NOTE: You should not remove the currently matched node directly during a while (walker.nextNode()) { ... } iteration.
    Doing so can cause the TreeWalker’s internal state to become inconsistent,
    resulting in unpredictable behavior (such as skipping nodes, getting stuck, or errors).
    */
    for (const n of nodesToRemove) {
      n.remove();
    }

} // fun

function nodeImporter(accumulator, record){

  //IMPROVEMENT: all record content is made iterable (wrapped in array if a node)

  if( record.isStringType ){
    const textNode = document.createTextNode(record.content);
    accumulator.push(textNode);

  }else if( record.isSignalType ){
    const signal = record.content;
    const textNode = document.createTextNode(signal.value);
    const unsubscribe = signal.subscribe((v) => (textNode.nodeValue = v));
    record.unsubscribe.push(unsubscribe);
    accumulator.push(textNode);

  }else if( record.isArrayType ){
    //WARN: this may cause an error with is Node
    for(const node of record){
      accumulator.push(node);
    }

  }else if( record.isElements ){
    //WARN: this may cause an error with is Node
    for(const node of record){
      accumulator.push(node);
    }

  }else{
    const textNode = document.createTextNode(`Unsupported Data Type ${record.type}.`);
    accumulator.push(textNode);
  }


} // nodeImporter


/**
 * Collects CSS class names, splits strings with spaces, removes falsy/negated classes, and returns a Set.
 * Usage:
 *   classes('foo bar', { baz: true, bar: false }, ['qux', 'zap'], null, undefined)
 *   // => Set { 'foo', 'baz', 'qux', 'zap' }
 *
 * @param  {...any} args
 * @returns {Set<string>}
 */
function classes(...args) {
  const result = new Set();

  const addClass = (cls) => {
    if (typeof cls === 'string') {
      cls.split(' ').forEach(str => {
        if (str) result.add(str);
      });
    }
  };

  const process = (arg) => {
    if (!arg) return;
    if (typeof arg === 'string') {
      addClass(arg);
    } else if (Array.isArray(arg)) {
      arg.forEach(process);
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, key)) {
          if (arg[key]) addClass(key);
          else result.delete(key); // falsy value: remove class if already present
        }
      }
    }
    // ignore other types
  };

  args.forEach(process);
  return result;
}

// Example usage:
// classes('foo bar', {baz: true, bar: false}, ['qux', 'zap'], null, undefined)
// => Set { 'foo', 'baz', 'qux', 'zap' }

export { html, Signal };



/*


      if (record.isStringType) {
        console.log(content);
        const textNode = document.createTextNode(content + "after");

        // parentNode.insertAfter(textNode, currentNode);
        currentNode.after(textNode);
      } else if (record.isElementDomainType) {
        parentNode.insertAfter(content, currentNode);
      } else if (record.isStringType) {
        const textNode = document.createTextNode(content);

        // parentNode.insertAfter(textNode, currentNode);
        currentNode.after(textNode);
      } else if (record.isNumberType) {
        const textNode = document.createTextNode(content);
        parentNode.insertAfter(textNode, currentNode);

      } else if (record.isSignalType) {

        const signal = record.content;
        const textNode = document.createTextNode(signal.value);


        currentNode.after(textNode);

        const unsubscribe = signal.subscribe((v) => (textNode.nodeValue = v));
        record.unsubscribe.push(unsubscribe);

      } else if (record.isElementDomainListType) {
        let target = currentNode;
        content.forEach((node) => {
          target = parentNode.insertAfter(node, target);
        });
      } else if (record.isHTMLCollectionType) {
        let target = currentNode;
        content.forEach((node) => {
          target = parentNode.insertAfter(node, target);
        });
      } else {
        const textNode = document.createTextNode(content);
        parentNode.insertAfter(textNode, currentNode);
      }










      if (record.isStringType) {
        const textNode = document.createTextNode(content + "after");
        currentNode.after(textNode);
      } else if (record.isElementDomainType) {
        parentNode.insertAfter(content, currentNode);
      } else if (record.isStringType) {
        const textNode = document.createTextNode(content);

        // parentNode.insertAfter(textNode, currentNode);
        currentNode.after(textNode);
      } else if (record.isNumberType) {
        const textNode = document.createTextNode(content);
        parentNode.insertAfter(textNode, currentNode);

      } else if (record.isSignalType) {

        const signal = record.content;
        const textNode = document.createTextNode(signal.value);


        currentNode.after(textNode);

        const unsubscribe = signal.subscribe((v) => (textNode.nodeValue = v));
        record.unsubscribe.push(unsubscribe);

      } else if (record.isElementDomainListType) {
        let target = currentNode;
        content.forEach((node) => {
          target = parentNode.insertAfter(node, target);
        });
      } else if (record.isHTMLCollectionType) {
        let target = currentNode;
        content.forEach((node) => {
          target = parentNode.insertAfter(node, target);
        });
      } else {
        const textNode = document.createTextNode(content);
        parentNode.insertAfter(textNode, currentNode);
      }
*/
