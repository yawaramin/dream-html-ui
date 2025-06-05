(() => {
  const IS_ACTIVE = 'is-active';
  const TAB = 9;
  const ESC = 27;
  const UP_ARROW = 38;
  const DOWN_ARROW = 40;

  /** @type {<A>(a: A | null) => A} */
  function notNull(value) {
    if (value == null) throw TypeError('Value is null or undefined');
    return value;
  }

  function loading(el) {
    el?.classList.add('is-loading');
  }

  function loaded(el) {
    el?.classList.remove('is-loading');
  }

  function hide(el) {
    el?.classList.add('is-hidden');
  }

  function show(el) {
    el?.classList.remove('is-hidden');
  }

  function activate(el) {
    el?.classList.add(IS_ACTIVE);
  }

  function deactivate(el) {
    el?.classList.remove(IS_ACTIVE);
  }

  function isActive(el) {
    return el?.classList.contains(IS_ACTIVE);
  }

  function h(obj) {
    if (typeof (obj) == 'string') {
      return document.createTextNode(obj);
    }

    const elem = document.createElement(obj.tag);

    for (const attr in obj.attrs) {
      elem.setAttribute(attr, obj.attrs[attr]);
    }

    for (const child of obj.children) {
      elem.appendChild(h(child));
    }

    return elem;
  }

  customElements.define('combo-box', class extends HTMLElement {
    /** @type {HTMLAnchorElement | null} */
    #selected = null;

    #numItems = 0;

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
      const options = document.querySelectorAll(`#${value} > option`);

      this.loading = true;
      this.dropdownContent.textContent = '';
      for (const option of options) {
        this.addItem(option.value, option.textContent || option.value, this.#numItems++);
      }
      this.loading = false;

      this.#listObserver?.disconnect();
      this.#listObserver?.observe(document.getElementById(value), {
        attributes: true,
        attributeFilter: ['value'],
        attributeOldValue: true,
        childList: true,
        subtree: true,
      });
    }

    set active(value) {
      if (value) {
        activate(this);
      } else {
        deactivate(this);
      }
    }

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

    /** @type {NodeListOf<HTMLAnchorElement>} */
    get shownItems() {
      return this.querySelectorAll('a.dropdown-item:not(.is-hidden)');
    }

    /** @type {(value: string, text: string, tabIndex: number) => void} */
    addItem(value, text, tabIndex) {
      this.dropdownContent.appendChild(h({
        tag: 'a',
        attrs: {
          class: 'dropdown-item',
          tabindex: tabIndex,
          'data-value': value,
          role: 'menuitem',
        },
        children: [text],
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
                  const item = this.querySelector(`a.dropdown-item[data-value="${mutation.oldValue}"]`);

                  item.setAttribute('data-value', mutation.target.value);
                  item.textContent = mutation.target.textContent || mutation.target.value;
                }

                break;

              case 'childList':
                for (const addedNode of mutation.addedNodes) {
                  if (addedNode.nodeName == 'OPTION') {
                    this.addItem(addedNode.value, addedNode.textContent || addedNode.value, this.#numItems++);
                  }
                }

                for (const removedNode of mutation.removedNodes) {
                  if (removedNode.nodeName == 'OPTION') {
                    const nodeValue = removedNode.getAttribute('value');
                    this.querySelector('.dropdown-content').removeChild(this.querySelector(`a.dropdown-item[data-value="${nodeValue}"]`));
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

      /** @type {NodeListOf<HTMLAnchorElement>} */
      const items = this.querySelectorAll('a.dropdown-item');

      this.#numItems = items.length;

      inp.addEventListener('click', () => {
        if (!isActive(this)) {
          activate(this);
        }
      });

      inp.addEventListener('keydown', evt => {
        switch (evt.keyCode) {
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

      inp.addEventListener('keyup', evt => {
        if (!isActive(this)) {
          activate(this);
        }

        if (isActive(this.#selected)) {
          deactivate(this.#selected);
          this.#selected = null;
        }

        for (const item of items) {
          if (notNull(item.textContent).toLowerCase().includes(inp.value.toLowerCase())) {
            show(item);
          } else {
            hide(item);
          }

          if (item.textContent == inp.value) {
            deactivate(this.#selected);
            activate(item);
            this.#selected = item;
          }
        }
      });

      for (const item of items) {
        item.role = 'menuitem';

        if (isActive(item)) {
          this.#selected = item;
        }

        item.addEventListener('click', evt => {
          evt.preventDefault();
          inp.value = notNull(item.getAttribute('data-value'));

          deactivate(this.#selected);
          activate(item);
          this.#selected = item;
          deactivate(this);
        });

        item.addEventListener('keydown', evt => {
          switch (evt.keyCode) {
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

            case 13: // Enter
            case 32: // Space
              item.click();
              break;
          }
        });
      }
    }
  });

  document.addEventListener('click', evt => {
    for (const combo of document.querySelectorAll('combo-box')) {
      if (evt.target == null || !combo.contains(evt.target)) {
        combo.active = false;
      }
    }
  })
})();
