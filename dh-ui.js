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
  const LEFT_ARROW = 'ArrowLeft';
  const RIGHT_ARROW = 'ArrowRight';

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
    el?.classList.add('is-white');
  }

  /** @type {(el: Element | null) => void} */
  function nowhite(el) {
    el?.classList.remove('is-white');
  }

  /** @type {(el: Element | null) => void} */
  function primary(el) {
    el?.classList.add('is-primary');
  }

  /** @type {(el: Element | null) => void} */
  function noprimary(el) {
    el?.classList.remove('is-primary');
  }

  /** @type {(el: Element | null) => void} */
  function danger(el) {
    el?.classList.add('is-danger');
  }

  /** @type {(el: Element | null) => void} */
  function nodanger(el) {
    el?.classList.remove('is-danger');
  }

  /** @type {(el: Element | null) => void} */
  function success(el) {
    el?.classList.add('is-success');
  }

  /** @type {(el: Element | null) => void} */
  function nosuccess(el) {
    el?.classList.remove('is-success');
  }

  /** @type {(el: Element | null) => boolean} */
  function isActive(el) {
    return el != null && el.classList.contains(IS_ACTIVE);
  }

  /** @type {(el: Element | null) => boolean} */
  function isDanger(el) {
    return el != null && el.classList.contains('is-danger');
  }

  /** @type {(el: Element | null) => boolean} */
  function isHidden(el) {
    return el != null && el.classList.contains('is-hidden');
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
  });

  document.body.addEventListener('focusin', evt => {
    const elem = evt.target;

    if ((elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement || elem instanceof HTMLSelectElement) && isDanger(elem)) {
      elem.reportValidity();
    }
  });

  document.body.addEventListener('focusout', evt => {
    const elem = evt.target;

    if (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement || elem instanceof HTMLSelectElement) {
      if (elem.value == '') {
        nodanger(elem);
        nosuccess(elem);
      } else if (elem.checkValidity()) {
        nodanger(elem);
        success(elem);
      } else {
        nosuccess(elem);
        danger(elem);
      }
    }
  });

  customElements.define('dh-combobox', class extends HTMLElement {
    /** @type {MutationObserver | null} */
    #listObserver = null;

    #input = notNull(this.querySelector('input'));

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
      this.#input.addEventListener('focus', () => {
        if (!isActive(this)) {
          activate(this);
        }
      });

      this.#input.addEventListener('keydown', evt => {
        switch (evt.key) {
          case ESC:
            this.#input.blur();
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

      this.#input.addEventListener('keyup', () => this.#handleChange());
      this.#input.addEventListener('search', () => this.#handleChange());

      const content = this.dropdownContent;

      content.addEventListener('click', evt => {
        if (evt.target instanceof HTMLButtonElement) {
          const item = evt.target;

          evt.preventDefault();
          this.#input.value = notNull(item.getAttribute('value'));

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

              this.#input.focus();
              break;

            case ESC:
              deactivate(this);
              break;
          }
        }
      });
    }

    #handleChange() {
      if (!isActive(this)) {
        activate(this);
      }

      deactivate(this.selectedItem);

      for (const item of this.allItems) {
        const content = notNull(item.textContent).trim().replace(WS, ' ');

        if (content.toLowerCase().includes(this.#input.value.toLowerCase())) {
          show(item);
        } else {
          hide(item);
        }

        if (content == this.#input.value) {
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

  /** @type {(dt: Date) => string} */
  function yyyyMMdd(dt) {
    const yyyy = dt.getFullYear();
    const MM = (dt.getMonth() + 1).toString().padStart(2, '0');
    const dd = (dt.getDate()).toString().padStart(2, '0');

    return `${yyyy}-${MM}-${dd}`;
  }

  /** @type {(iso: string) => Date} */
  function dateFromISO(iso) {
    return new Date(`${iso}T00:00`);
  }

  /** @type {(dt: Date, f: (date: number) => number) => Date} */
  function setDate(dt, f) {
    const newDate = new Date(dt);
    newDate.setDate(f(newDate.getDate()));

    return newDate;
  }

  /** @type {(dt: Date, f: (month: number) => number) => Date} */
  function setMonth(dt, f) {
    const newDate = new Date(dt);
    newDate.setMonth(f(newDate.getMonth()));

    return newDate;
  }

  /** @type {(dt: Date, f: (month: number) => number) => Date} */
  function setYear(dt, f) {
    const newDate = new Date(dt);
    newDate.setFullYear(f(newDate.getFullYear()));

    return newDate;
  }

  const yearFmt = new Intl.DateTimeFormat(navigator.language, { year: 'numeric' });
  const monthYearFmt = new Intl.DateTimeFormat(navigator.language, { month: 'long', year: 'numeric' });
  const monthFmt = new Intl.DateTimeFormat(navigator.language, { month: 'short' });
  const weekdayFmt = new Intl.DateTimeFormat(navigator.language, { weekday: 'narrow' });
  const dateFmt = new Intl.DateTimeFormat(navigator.language, { dateStyle: 'long' });
  const dayFmt = new Intl.DateTimeFormat(navigator.language, { day: 'numeric' });

  const weekdays = [
    new Date('2025-06-09T00:00'),
    new Date('2025-06-10T00:00'),
    new Date('2025-06-11T00:00'),
    new Date('2025-06-12T00:00'),
    new Date('2025-06-13T00:00'),
    new Date('2025-06-14T00:00'),
    new Date('2025-06-15T00:00'),
  ];

  const DATE_BUTTONS_SEL = 'tr > td > button';

  function monthBtn(dt) {
    return h('td', {}, h('button.button.is-fullwidth.is-white', {}, monthFmt.format(dt)));
  }

  customElements.define('dh-datepicker', class extends HTMLElement {
    #minWidth = 0;

    /** @type {HTMLInputElement} */
    #input = notNull(this.querySelector('input'));

    #btnLeft = /** @type {HTMLButtonElement} */(h('button.button', {}, [
      h('span.icon is-small', {}, '◀'),
    ]));

    #btnMonthYear = /** @type {HTMLButtonElement} */(h('button.button.is-fullwidth', {}, ''));
    #btnRight = /** @type {HTMLButtonElement} */(h('button.button', {}, [h('span.icon.is-small', {}, '▶')]));
    #btnToday = /** @type {HTMLButtonElement} */(h('button.button.is-small.is-fullwidth', {}, ''));

    #headerRow = /** @type {HTMLDivElement} */(h('div.dropdown-item', {}, h('div.field is-grouped', {}, [
      h('p.control', {}, [this.#btnLeft]),
      h('p.control.is-flex.is-flex-grow-1', {}, this.#btnMonthYear),
      h('p.control', {}, this.#btnRight),
    ])));

    #monthViewTbody = h('tbody', {}, genArray(6, () =>
      h('tr', {}, genArray(7, () =>
        h('td', {}, h('button.button.is-small.is-fullwidth.is-white', {}, ''))))));

    #monthView = /** @type {HTMLDivElement} */(h('div.dropdown-item', {},
      h('table.is-narrow.table', {}, [
        h('thead', {}, weekdays.map(d => h('th.has-text-right.pr-3', {}, weekdayFmt.format(d)))),
        this.#monthViewTbody,
      ])));

    #yearViewTbody = h('tbody', {}, [
      h('tr', {}, [0, 1, 2].map(monthIdx => monthBtn(setMonth(weekdays[0], () => monthIdx)))),
      h('tr', {}, [3, 4, 5].map(monthIdx => monthBtn(setMonth(weekdays[0], () => monthIdx)))),
      h('tr', {}, [6, 7, 8].map(monthIdx => monthBtn(setMonth(weekdays[0], () => monthIdx)))),
      h('tr', {}, [9, 10, 11].map(monthIdx => monthBtn(setMonth(weekdays[0], () => monthIdx)))),
    ]);

    #yearView = /** @type {HTMLDivElement} */(h('div.dropdown-item.is-hidden', {},
      h('table.table.is-fullwidth', {}, this.#yearViewTbody)));

    #footerRow = h('div.dropdown-item', {},
      h('div.field.is-grouped', {},
        h('p.control.is-flex.is-flex-grow-1', {}, this.#btnToday)));

    connectedCallback() {
      const key = this.#input.id || crypto.randomUUID();
      const menuId = `calendar-menu-${key}`;

      this.#input.setAttribute('aria-controls', menuId);

      this.appendChild(h('div.dropdown-menu', { id: menuId, role: 'menu' },
        h('div.dropdown-content', {}, [
          this.#headerRow,
          this.#yearView,
          this.#monthView,
          this.#footerRow,
        ])));

      this.#input.addEventListener('focus', () => {
        if (!isActive(this)) {
          hide(this.#yearView);
          show(this.#monthView);
          this.#render(this.#date);
          activate(this);

          if (this.#minWidth == 0) {
            this.#minWidth = this.#monthView.offsetWidth;
            this.#yearView.style.minWidth = `${this.#minWidth}px`;
          }
        }
      });

      this.#input.addEventListener('keydown', evt => {
        switch (evt.key) {
          case ESC:
            deactivate(this);
            break;

          case DOWN_ARROW:
            this.#btnMonthYear.focus();
            break;
        }
      });

      this.#btnLeft.addEventListener('click', () => {
        this.#render(dateFromISO(notNull(this.#btnLeft.value)));
      });

      this.#headerRow.addEventListener('keydown', evt => {
        const elem = evt.target;

        if (elem instanceof HTMLButtonElement) {
          switch (evt.key) {
            case LEFT_ARROW:
              elem.parentNode?.previousSibling?.firstChild?.focus();
              break;

            case RIGHT_ARROW:
              elem.parentNode?.nextSibling?.firstChild?.focus();
              break;

            case UP_ARROW:
              this.#input.focus();
              break;

            case DOWN_ARROW:
              this.querySelector('.dropdown-item:not(.is-hidden) > .table > tbody > tr > td > .button')?.focus();
              break;
          }
        }
      });

      this.#btnRight.addEventListener('click', () => {
        this.#render(dateFromISO(notNull(this.#btnRight.value)));
      });

      this.#btnMonthYear.addEventListener('click', () => {
        const dt = dateFromISO(notNull(this.#btnMonthYear.value));

        if (this.#isYearView) {
          hide(this.#yearView);
          show(this.#monthView);
          this.#render(dt);
        } else {
          hide(this.#monthView);
          show(this.#yearView);
          this.#render(dt);
        }
      });

      this.#btnToday.addEventListener('click', () => {
        this.#input.value = notNull(this.#btnToday.value);
        deactivate(this);
        this.#valid = true;
      });

      this.#monthViewTbody.addEventListener('keydown', evt => this.#handleTbodyKeydown(evt));
      this.#yearViewTbody.addEventListener('keydown', evt => this.#handleTbodyKeydown(evt));

      this.#monthViewTbody.addEventListener('click', evt => {
        const elem = evt.target;

        if (elem instanceof HTMLButtonElement) {
          this.#input.value = notNull(elem.value);
          deactivate(this);
          this.#valid = true;
        }
      });

      this.#yearViewTbody.addEventListener('click', evt => {
        const elem = evt.target;

        if (elem instanceof HTMLButtonElement) {
          this.#render(dateFromISO(notNull(elem.value)));
          hide(this.#yearView);
          show(this.#monthView);
          this.#render(dateFromISO(notNull(this.#btnMonthYear.value)));
          this.#monthViewTbody.querySelector('.button')?.focus();
        }
      });

      this.#btnToday.addEventListener('keydown', evt => {
        if (evt.key == UP_ARROW) {
          this.querySelector('.dropdown-item:not(.is-hidden) > .table > tbody > tr:last-child > td > .button')?.focus();
        }
      });
    }

    #handleTbodyKeydown(evt) {
      const elem = evt.target;

      if (elem instanceof HTMLButtonElement) {
        switch (evt.key) {
          case LEFT_ARROW:
            elem.parentNode?.previousSibling?.firstChild?.focus();
            break;

          case RIGHT_ARROW:
            elem.parentNode?.nextSibling?.firstChild?.focus();
            break;

          case UP_ARROW:
            const prevRow = elem.parentNode?.parentNode?.previousSibling;

            if (prevRow == null) {
              this.#btnMonthYear.focus();
            } else {
              prevRow.childNodes[Array.from(elem.parentNode.parentNode.childNodes).indexOf(elem.parentNode)]?.firstChild?.focus();
            }

            break;

          case DOWN_ARROW:
            const nextRow = elem.parentNode?.parentNode?.nextSibling;

            if (nextRow == null) {
              this.#btnToday.focus();
            } else {
              nextRow.childNodes[Array.from(elem.parentNode.parentNode.childNodes).indexOf(elem.parentNode)]?.firstChild?.focus();
            }

            break;
        }
      }
    }

    get #isYearView() {
      return !isHidden(this.#yearView);
    }

    set #valid(value) {
      if (value) {
        nodanger(this.#input);
        success(this.#input);
      } else {
        nosuccess(this.#input);
        danger(this.#input);
      }
    }

    get #date() {
      const d = dateFromISO(this.#input.value);

      if (isNaN(d.valueOf())) {
        return new Date();
      }

      return d;
    }

    #render(dt) {
      const currDate = this.#date;
      const prevMonth = setDate(dt, () => 0);

      if (this.#isYearView) {
        const prevYear = setYear(setMonth(setDate(dt, () => 1), () => 0), y => y - 1);
        this.#btnLeft.title = yearFmt.format(prevYear);
        this.#btnLeft.value = yyyyMMdd(prevYear);

        const nextYear = setYear(setMonth(setDate(dt, () => 1), () => 0), y => y + 1);
        this.#btnRight.title = yearFmt.format(nextYear);
        this.#btnRight.value = yyyyMMdd(nextYear);

        this.#btnMonthYear.textContent = yearFmt.format(dt);
        this.#btnMonthYear.value = yyyyMMdd(dt);
      } else {
        // Last day of the previous month
        this.#btnLeft.title = monthYearFmt.format(prevMonth);
        this.#btnLeft.value = yyyyMMdd(prevMonth);

        // First day of the next month
        const nextMonth = setDate(setMonth(dt, m => m + 1), () => 1);
        this.#btnRight.title = monthYearFmt.format(nextMonth);
        this.#btnRight.value = yyyyMMdd(nextMonth);

        this.#btnMonthYear.textContent = monthYearFmt.format(dt);
        this.#btnMonthYear.value = yyyyMMdd(dt);
      }

      const today = new Date();
      this.#btnToday.textContent = dateFmt.format(today);
      this.#btnToday.value = yyyyMMdd(today);

      const month1st = setDate(dt, () => 1);
      const monthLast = setDate(setMonth(month1st, m => m + 1), () => 0);
      const dow1 = month1st.getDay();
      const dow1offset = dow1 == 0 ? 6 : dow1 - 1;
      const monthButtons = this.#monthViewTbody.querySelectorAll(DATE_BUTTONS_SEL);
      const yearButtons = this.#yearViewTbody.querySelectorAll(DATE_BUTTONS_SEL);

      for (let idx = 0; idx < 12; idx++) {
      /** @type {HTMLButtonElement} */(yearButtons[idx]).value = yyyyMMdd(setDate(setMonth(dt, () => idx), () => 1));
      }

      for (let idx = 0; idx < dow1offset; idx++) {
        const btn = /** @type {HTMLButtonElement} */(monthButtons[idx]);
        const btnDate = setDate(prevMonth, d => d - dow1offset + idx + 1);

        noprimary(btn);
        nowhite(btn);
        light(btn);
        btn.textContent = dayFmt.format(btnDate);
        btn.value = yyyyMMdd(btnDate);
      }

      for (let day = 1; day <= monthLast.getDate(); day++) {
        const btn = /** @type {HTMLButtonElement} */(monthButtons[dow1offset + day - 1]);
        const dayDate = setDate(month1st, () => day);

        btn.textContent = dayFmt.format(dayDate);
        btn.value = yyyyMMdd(dayDate);
        nolight(btn);
        white(btn);

        if (dayDate.toDateString() == currDate.toDateString()) {
          primary(btn);
        } else {
          noprimary(btn);
        }
      }

      let day = 1;
      for (let idx = dow1offset + monthLast.getDate(); idx < monthButtons.length; idx++) {
        const btn = /** @type {HTMLButtonElement} */(monthButtons[idx]);
        const btnDate = setDate(monthLast, d => d + day);

        btn.textContent = dayFmt.format(btnDate);
        btn.value = yyyyMMdd(btnDate);
        noprimary(btn);
        nowhite(btn);
        light(btn);
        day++;
      }
    }
  });
})();
