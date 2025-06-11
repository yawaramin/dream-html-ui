/** @type {(s: string) => Element | null} */
function $(s) { return document.querySelector(s); }

/** @type {(s: string) => NodeListOf<Element>} */
function $$(s) { return document.querySelectorAll(s); }

(() => {
  const IS_ACTIVE = 'is-active';
  const IS_LOADING = 'is-loading';
  const TAB = 'Tab';
  const ESC = 'Escape';
  const UP_ARROW = 'ArrowUp';
  const DOWN_ARROW = 'ArrowDown';

  /** @type {<A>(a: A | null) => A} */
  function notNull(value) {
    if (value == null) throw TypeError('Value is null or undefined');
    return value;
  }

  /** @type {(el: Element | null) => void} */
  function loading(el) {
    el?.classList.add(IS_LOADING);
  }

  /** @type {(el: Element | null) => void} */
  function loaded(el) {
    el?.classList.remove(IS_LOADING);
  }

  /** @type {(el: Element | null) => void} */
  function hide(el) {
    el?.classList.add('is-hidden');
  }

  /** @type {(el: Element | null) => void} */
  function show(el) {
    el?.classList.remove('is-hidden');
  }

  /** @type {(el: Element | null) => void} */
  function activate(el) {
    el?.classList.add(IS_ACTIVE);
  }

  /** @type {(el: Element | null) => void} */
  function deactivate(el) {
    el?.classList.remove(IS_ACTIVE);
  }

  /** @type {(el: Element | null) => boolean} */
  function isActive(el) {
    return el != null && el.classList.contains(IS_ACTIVE);
  }

  /**
   * @typedef {object} HObj
   * @prop {string} tag
   * @prop {Record<string, string>} attrs
   * @prop {string | Array<string | HObj>} children
   */

  /** @type {(obj: string | HObj) => Element | Text} */
  function h(obj) {
    if (typeof (obj) == 'string') {
      return document.createTextNode(obj);
    }

    const elem = document.createElement(obj.tag);

    for (const attr in obj.attrs) {
      elem.setAttribute(attr, obj.attrs[attr]);
    }

    if (typeof (obj.children) == 'string') {
      elem.appendChild(document.createTextNode(obj.children));
    } else {
      for (const child of obj.children) {
        elem.appendChild(h(child));
      }
    }

    return elem;
  }

  /** @type {RegExp} */
  const WS = /[\t\n\r ]+/g;

  document.addEventListener('click', evt => {
    if (evt.target == null) {
      return;
    }

    for (const dropdown of document.querySelectorAll('.dropdown')) {
      if (!dropdown.contains(evt.target)) {
        deactivate(dropdown);
      }
    }
  })

  customElements.define('dh-combobox', class extends HTMLElement {
    /** @type {MutationObserver | null} */
    #listObserver = null;

    /** @type {string | null} */
    #list = null;

    static get observedAttributes() {
      return ['list'];
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'list':
          this.listId = newValue;
          break;
      }
    }

    set listId(value) {
      if (value == null || value == this.#list) {
        return;
      }

      this.#list = value;

      this.loading = true;
      this.dropdownContent.textContent = '';
      let numItems = 0;

      for (const option of this.listOptions) {
        this.addItem(option.value, option.textContent || option.value, numItems++);
      }
      this.loading = false;

      this.#listObserver?.disconnect();
      this.#listObserver?.observe(notNull(document.getElementById(value)), {
        attributes: true,
        attributeFilter: ['value'],
        attributeOldValue: true,
        childList: true,
        subtree: true,
      });
    }

    /** @type {(value: boolean) => void} */
    set loading(value) {
      const trigger = this.querySelector('.dropdown-trigger');
      const icon = this.querySelector('.icon');

      if (value) {
        hide(icon);
        loading(trigger);
      } else {
        loaded(trigger);
        show(icon);
      }
    }

    /** @type {HTMLDivElement} */
    get dropdownContent() {
      return notNull(this.querySelector('.dropdown-content'));
    }

    /** @type {HTMLButtonElement | null} */
    get selectedItem() {
      return this.querySelector(`.dropdown-item.${IS_ACTIVE}`);
    }

    /** @type {NodeListOf<HTMLButtonElement>} */
    get allItems() {
      return this.querySelectorAll('.dropdown-item[value]');
    }

    /** @type {NodeListOf<HTMLButtonElement>} */
    get shownItems() {
      return this.querySelectorAll('.dropdown-item[value]:not(.is-hidden)');
    }

    /** @type {NodeListOf<HTMLOptionElement>} */
    get listOptions() {
      return document.querySelectorAll(`#${this.#list} > option`);
    }

    /** @type {(value: string, text: string, tabIndex: number) => void} */
    addItem(value, text, tabIndex) {
      this.dropdownContent.appendChild(h({
        tag: 'button',
        attrs: {
          class: 'dropdown-item',
          tabindex: tabIndex.toString(),
          value,
          role: 'menuitem',
        },
        children: text,
      }));
    }

    constructor() {
      super();

      const listId = this.getAttribute('list');

      if (listId != null) {
        this.#listObserver = new MutationObserver(mutations => {
          for (const mutation of mutations) {
            switch (mutation.type) {
              case 'attributes':
                if (mutation.target.nodeName == 'OPTION' && mutation.attributeName == 'value') {
                  const item = notNull(this.querySelector(`.dropdown-item[value="${mutation.oldValue}"]`));

                  item.setAttribute('value', mutation.target.value);
                  item.textContent = mutation.target.textContent || mutation.target.value;
                }

                break;

              case 'childList':
                let numItems = 0;

                for (const addedNode of mutation.addedNodes) {
                  if (addedNode.nodeName == 'OPTION') {
                    this.addItem(addedNode.value, addedNode.textContent || addedNode.value, numItems++);
                  }
                }

                for (const removedNode of mutation.removedNodes) {
                  if (removedNode.nodeName == 'OPTION') {
                    const nodeValue = removedNode.getAttribute('value');
                    this.querySelector('.dropdown-content').removeChild(this.querySelector(`.dropdown-item[value="${nodeValue}"]`));
                  }
                }

                break;
            }
          }
        });
      }
    }

    connectedCallback() {
      const inp = notNull(this.querySelector('input'));

      inp.addEventListener('focus', () => {
        if (!isActive(this)) {
          activate(this);
        }
      });

      inp.addEventListener('keydown', evt => {
        switch (evt.key) {
          case ESC:
            inp.blur();
            deactivate(this);
            break;

          case TAB:
            deactivate(this);
            break;

          case DOWN_ARROW:
            const shownItems = this.shownItems;

            if (shownItems.length > 0) {
              shownItems[0].focus();
            }
            break;
        }
      });

      inp.addEventListener('keyup', () => {
        if (!isActive(this)) {
          activate(this);
        }

        deactivate(this.selectedItem);

        for (const item of this.allItems) {
          const content = notNull(item.textContent).trim().replace(WS, ' ');

          if (content.toLowerCase().includes(inp.value.toLowerCase())) {
            show(item);
          } else {
            hide(item);
          }

          if (content == inp.value) {
            activate(item);
          }
        }
      });

      const content = this.dropdownContent;

      content.addEventListener('click', evt => {
        if (evt.target?.nodeName == 'BUTTON') {
          const item = notNull(evt.target);

          evt.preventDefault();
          inp.value = notNull(item.getAttribute('value'));

          deactivate(this.selectedItem);
          activate(item);
          deactivate(this);
        }
      });

      content.addEventListener('keydown', evt => {
        const item = evt.target;

        if (item != null && item instanceof HTMLElement && item.classList.contains('dropdown-item') && item.getAttribute('value') != null) {
          switch (evt.key) {
            case DOWN_ARROW:
              for (const it of this.shownItems) {
                if (it.tabIndex > item.tabIndex) {
                  it.focus();
                  return;
                }
              }
              break;

            case UP_ARROW:
              const visibleItems = this.shownItems;

              for (let idx = visibleItems.length - 1; idx >= 0; idx--) {
                if (visibleItems[idx].tabIndex < item.tabIndex) {
                  visibleItems[idx].focus();
                  return;
                }
              }

              inp.focus();
              break;

            case ESC:
              deactivate(this);
              break;
          }
        }
      });
    }
  });

  customElements.define('date-picker', class extends HTMLElement {
    connectedCallback() {
      const inp = this.input;
      const key = inp.name || inp.id || crypto.randomUUID();
      const menuId = `${key}-menu`;

      inp.ariaHasPopup = 'true';
      inp.setAttribute('aria-controls', menuId);

      this.render();
    }

    render() {
      const inp = this.input;

    }

    get input() {
      return notNull(this.querySelector('input'));
    }
  });
})();

/*
const headerFmt = new Intl.DateTimeFormat(navigator.language, {month: 'long', year: 'numeric'});
const weekdayFmt = new Intl.DateTimeFormat(navigator.language, {weekday: 'narrow'});
const monthFmt = new Intl.DateTimeFormat(navigator.language, {month: 'short'});
const now = new Date();
weekdayFmt.format(now);

const locale = new Intl.Locale(navigator.language);
const weekInfo = locale.getWeekInfo();
*/
