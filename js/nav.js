"use strict";
/**
 * Priority+ navigation.
 *
 * When the section links do not fit on one line, the lowest-priority ones move
 * into a "…" menu — lowest first, as set by data-priority on each link (Time
 * goes first). Space returning brings them back in their original order.
 * Without JavaScript the links simply wrap; nothing is hidden.
 */
(function initializePriorityNav() {
    var _a, _b, _c, _d;
    const nav = document.querySelector('.site-nav');
    const list = (_a = nav === null || nav === void 0 ? void 0 : nav.querySelector('.site-nav__list')) !== null && _a !== void 0 ? _a : null;
    const more = (_b = nav === null || nav === void 0 ? void 0 : nav.querySelector('.site-nav__more')) !== null && _b !== void 0 ? _b : null;
    const button = (_c = more === null || more === void 0 ? void 0 : more.querySelector('.site-nav__more-button')) !== null && _c !== void 0 ? _c : null;
    const menu = (_d = more === null || more === void 0 ? void 0 : more.querySelector('.site-nav__more-menu')) !== null && _d !== void 0 ? _d : null;
    if (!nav || !list || !more || !button || !menu)
        return;
    const items = Array.from(list.children);
    const priorityOf = (li) => { var _a, _b; return Number((_b = (_a = li.querySelector('a')) === null || _a === void 0 ? void 0 : _a.dataset.priority) !== null && _b !== void 0 ? _b : 0); };
    // Highest data-priority number collapses first.
    const collapseOrder = [...items].sort((a, b) => priorityOf(b) - priorityOf(a));
    function isOpen() {
        return button.getAttribute('aria-expanded') === 'true';
    }
    function open() {
        menu.hidden = false;
        button.setAttribute('aria-expanded', 'true');
    }
    function close() {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
    }
    function overflowing() {
        return list.scrollWidth > list.clientWidth + 1;
    }
    function layout() {
        nav.classList.add('site-nav--priority');
        // Start from everything visible, in original order.
        items.forEach((li) => list.appendChild(li));
        more.hidden = true;
        // Collapse one at a time until the row fits, keeping at least one link.
        let index = 0;
        while (overflowing() && index < collapseOrder.length - 1) {
            more.hidden = false; // the button now takes width; measure with it present
            menu.appendChild(collapseOrder[index]);
            index += 1;
        }
        // Menu shows collapsed items in their original order, not collapse order.
        const collapsed = items.filter((li) => li.parentElement === menu);
        collapsed.forEach((li) => menu.appendChild(li));
        // If the current page is in the menu, mark the button so it is not lost.
        more.classList.toggle('active', collapsed.some((li) => li.querySelector('a.active') !== null));
        if (more.hidden)
            close();
    }
    button.addEventListener('click', () => (isOpen() ? close() : open()));
    document.addEventListener('click', (event) => {
        if (!more.contains(event.target))
            close();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen()) {
            close();
            button.focus();
        }
    });
    let frame = 0;
    const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(layout);
    };
    new ResizeObserver(schedule).observe(nav);
    if (document.fonts)
        document.fonts.ready.then(schedule); // widths change when the webfont lands
    layout();
})();
