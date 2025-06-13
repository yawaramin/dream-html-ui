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

  /** @type {(el: Element | null) => void} */
  function light(el) {
    el?.classList.add('is-light');
  }

  /** @type {(el: Element | null) => void} */
  function nolight(el) {
    el?.classList.remove('is-light');
  }

  /** @type {(el: Element | null) => void} */
  function white(el) {
    el?.classList.add('is-light');
  }

  /** @type {(el: Element | null) => void} */
  function nowhite(el) {
    el?.classList.remove('is-light');
  }

  /** @type {(el: Element | null) => void} */
  function primary(el) {
    el?.classList.add('is-primary');
  }

  /** @type {(el: Element | null) => void} */
  function noprimary(el) {
    el?.classList.remove('is-primary');
  }

  /** @type {(el: Element | null) => boolean} */
  function isActive(el) {
    return el != null && el.classList.contains(IS_ACTIVE);
  }

  /** @type {(tag: string, attrs: Record<string, string> | null, children: Array<Element | string> | Element | string | null) => Element} */
  function h(tag, attrs, children) {
    if (attrs == null) {
      attrs = {};
    }

    const tagClasses = tag.split('.');
    tag = tagClasses[0];

    if (tagClasses.length > 1) {
      attrs.class = tagClasses.slice(1).join(' ');
    }

    if (children == null) {
      children = [];
    }

    if (children instanceof Element || typeof children == 'string') {
      children = [children];
    }

    const elem = document.createElement(tag);

    for (const attr in attrs) {
      elem.setAttribute(attr, attrs[attr]);
    }

    for (const child of children) {
      if (typeof (child) == 'string') {
        elem.appendChild(document.createTextNode(child));
      } else {
        elem.appendChild(child);
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
      if (evt.target instanceof Node && dropdown.contains(evt.target)) { } else {
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

    /** @type {HTMLInputElement} */
    get input() {
      return notNull(this.querySelector('input'));
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
      this.dropdownContent.appendChild(h(
        'button.dropdown-item',
        {
          tabindex: tabIndex.toString(),
          value,
          role: 'menuitem',
        },
        text,
      ));
    }

    constructor() {
      super();

      const listId = this.getAttribute('list');

      if (listId != null) {
        this.#listObserver = new MutationObserver(mutations => {
          for (const mutation of mutations) {
            switch (mutation.type) {
              case 'attributes':
                if (mutation.target instanceof HTMLOptionElement && mutation.attributeName == 'value') {
                  const item = notNull(this.querySelector(`.dropdown-item[value="${mutation.oldValue}"]`));

                  item.setAttribute('value', mutation.target.value);
                  item.textContent = mutation.target.textContent || mutation.target.value;
                }

                break;

              case 'childList':
                let numItems = 0;

                for (const addedNode of mutation.addedNodes) {
                  if (addedNode instanceof HTMLOptionElement) {
                    this.addItem(addedNode.value, addedNode.textContent || addedNode.value, numItems++);
                  }
                }

                for (const removedNode of mutation.removedNodes) {
                  if (removedNode instanceof HTMLOptionElement) {
                    const nodeValue = removedNode.getAttribute('value');

                    this.querySelector('.dropdown-content')?.removeChild(notNull(this.querySelector(`.dropdown-item[value="${nodeValue}"]`)));
                  }
                }

                break;
            }
          }
        });
      }
    }

    connectedCallback() {
      const inp = this.input;

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

      inp.addEventListener('keyup', evt => this.#handleChange(evt));
      inp.addEventListener('search', evt => this.#handleChange(evt));

      const content = this.dropdownContent;

      content.addEventListener('click', evt => {
        if (evt.target instanceof HTMLButtonElement) {
          const item = evt.target;

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

    #handleChange(evt) {
      const inp = evt.target;

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
    }
  });

  /** @type {<A>(len: number, f: (n: number) => A) => A[]} */
  function genArray(len, f) {
    const arr = [];

    for (let i = 0; i < len; i++) {
      arr.push(f(i));
    }

    return arr;
  }

  function yyyyMMdd(dt) {
    const yyyy = dt.getFullYear();
    const MM = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = (dt.getDate()).toString().padStart(2, '0');

    return `${yyyy}-${MM}-${dd}`;
  }

  const headerFmt = new Intl.DateTimeFormat(navigator.language, { month: 'long', year: 'numeric' });
  const monthFmt = new Intl.DateTimeFormat(navigator.language, { month: 'long', year: 'numeric' });
  const weekdayFmt = new Intl.DateTimeFormat(navigator.language, { weekday: 'narrow' });
  const dateFmt = new Intl.DateTimeFormat(navigator.language, { dateStyle: 'long' });

  const monToFri = [
    new Date('2025-06-09T00:00'),
    new Date('2025-06-10T00:00'),
    new Date('2025-06-11T00:00'),
    new Date('2025-06-12T00:00'),
    new Date('2025-06-13T00:00'),
    new Date('2025-06-14T00:00'),
    new Date('2025-06-15T00:00'),
  ];

  customElements.define('dh-datepicker', class extends HTMLElement {
    #btnPrevMonth = h('button.button', {}, [
      h('span.icon is-small', {}, '◀️'),
    ]);

    #btnMonth = h('button.button.is-flex-grow-1', {}, '');
    #btnNextMonth = h('button.button', {}, [h('span.icon.is-small', {}, '️▶️')]);
    #btnToday = h('button.button.is-small.is-flex-grow-1', {}, '');

    connectedCallback() {
      const inp = this.#input;
      const key = inp.id || crypto.randomUUID();
      const menuId = `calendar-menu-${key}`;

      inp.ariaHasPopup = 'true';
      inp.type = 'search';
      inp.setAttribute('aria-controls', menuId);

      this.appendChild(h('div.dropdown-menu', { id: menuId, role: 'menu' },
        h('div.dropdown-content', {},
          h('div.dropdown-item', {}, [
            h('div.block', {},
              h('div.field is-grouped', {}, [
                h('p.control', {}, [this.#btnPrevMonth]),
                h('p.control.is-flex.is-flex-grow-1', {}, this.#btnMonth),
                h('p.control', {}, this.#btnNextMonth),
              ])),
            h('table.block.is-narrow.table', {}, [
              h('thead', {}, monToFri.map(d => h('th.has-text-right.pr-3', {}, weekdayFmt.format(d)))),
              h('tbody', {}, genArray(6, () =>
                h('tr', {}, genArray(7, () =>
                  h('td', {}, h('button.button.is-small.is-fullwidth.is-white', {}, '')))))),
            ]),
            h('div.block', {},
              h('div.field.is-grouped', {}, [
                h('p.control.is-flex.is-flex-grow-1', {}, this.#btnToday)
              ])
            ),
          ]))));

      this.#render(this.#date);

      inp.addEventListener('focus', () => {
        if (!isActive(this)) {
          activate(this);
        }
      });

      this.#btnPrevMonth.addEventListener('click', () => {
        const prevMonth = new Date(this.#date);
        prevMonth.setDate(0);

        this.#render(prevMonth);
      });

      this.#btnNextMonth.addEventListener('click', () => {
        const nextMonth = new Date(this.#date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);

        this.#render(nextMonth);
      });

      this.#btnToday.addEventListener('click', () => {
        inp.value = notNull(this.#btnToday.getAttribute('title'));
        deactivate(this);
      });
    }

    get #input() {
      return notNull(this.querySelector('input'));
    }

    get #date() {
      const d = new Date(`${this.#input.value}T00:00`);

      if (isNaN(d.valueOf())) {
        return new Date();
      }

      return d;
    }

    #render(dt) {
      const prevMonth = new Date(dt);
      prevMonth.setDate(0); // Last day of the previous month
      this.#btnPrevMonth.setAttribute('title', headerFmt.format(prevMonth));

      const nextMonth = new Date(dt);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1); // First day of the next month
      this.#btnNextMonth.setAttribute('title', headerFmt.format(nextMonth));

      this.#btnMonth.textContent = monthFmt.format(dt);

      const today = new Date();
      this.#btnToday.textContent = dateFmt.format(today);
      this.#btnToday.setAttribute('title', yyyyMMdd(today));

      const month1st = new Date(dt);
      month1st.setDate(1);

      const monthLast = new Date(dt);
      monthLast.setMonth(monthLast.getMonth() + 1);
      monthLast.setDate(0);

      const dow1 = month1st.getDay();
      const dow1offset = dow1 == 0 ? 6 : dow1 - 1;
      const tdButtons = this.querySelectorAll('tbody > tr > td > button');

      for (let idx = 0; idx < dow1offset; idx++) {
        nowhite(tdButtons[idx]);
        light(tdButtons[idx]);
        tdButtons[idx].textContent = (prevMonth.getDate() - dow1offset + idx + 1).toString();
      }

      for (let day = 1; day <= monthLast.getDate(); day++) {
        const idx = dow1offset + day - 1;
        tdButtons[dow1offset + day - 1].textContent = day.toString();

        if (day == dt.getDate()) {
          primary(tdButtons[idx]);
        } else {
          noprimary(tdButtons[idx]);
        }
      }
    }
  });
})();
