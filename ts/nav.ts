/**
 * Priority+ navigation.
 *
 * When the section links do not fit on one line, the lowest-priority ones move
 * into a "…" menu — lowest first, as set by data-priority on each link (Time
 * goes first). Space returning brings them back in their original order.
 * Without JavaScript the links simply wrap; nothing is hidden.
 */

(function initializePriorityNav(): void {
    const nav = document.querySelector<HTMLElement>('.site-nav');
    const list = nav?.querySelector<HTMLUListElement>('.site-nav__list') ?? null;
    const more = nav?.querySelector<HTMLElement>('.site-nav__more') ?? null;
    const button = more?.querySelector<HTMLButtonElement>('.site-nav__more-button') ?? null;
    const menu = more?.querySelector<HTMLUListElement>('.site-nav__more-menu') ?? null;
    if (!nav || !list || !more || !button || !menu) return;

    const items = Array.from(list.children) as HTMLLIElement[];
    const priorityOf = (li: HTMLLIElement): number =>
        Number(li.querySelector('a')?.dataset.priority ?? 0);
    // Highest data-priority number collapses first.
    const collapseOrder = [...items].sort((a, b) => priorityOf(b) - priorityOf(a));

    function isOpen(): boolean {
        return button!.getAttribute('aria-expanded') === 'true';
    }

    function open(): void {
        menu!.hidden = false;
        button!.setAttribute('aria-expanded', 'true');
    }

    function close(): void {
        menu!.hidden = true;
        button!.setAttribute('aria-expanded', 'false');
    }

    function overflowing(): boolean {
        return list!.scrollWidth > list!.clientWidth + 1;
    }

    function layout(): void {
        nav!.classList.add('site-nav--priority');

        // Start from everything visible, in original order.
        items.forEach((li) => list!.appendChild(li));
        more!.hidden = true;

        // Collapse one at a time until the row fits, keeping at least one link.
        let index = 0;
        while (overflowing() && index < collapseOrder.length - 1) {
            more!.hidden = false; // the button now takes width; measure with it present
            menu!.appendChild(collapseOrder[index]);
            index += 1;
        }

        // Menu shows collapsed items in their original order, not collapse order.
        const collapsed = items.filter((li) => li.parentElement === menu);
        collapsed.forEach((li) => menu!.appendChild(li));

        // If the current page is in the menu, mark the button so it is not lost.
        more!.classList.toggle('active', collapsed.some((li) => li.querySelector('a.active') !== null));

        if (more!.hidden) close();
    }

    button.addEventListener('click', () => (isOpen() ? close() : open()));
    document.addEventListener('click', (event) => {
        if (!more!.contains(event.target as Node)) close();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen()) {
            close();
            button!.focus();
        }
    });

    let frame = 0;
    const schedule = (): void => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(layout);
    };
    new ResizeObserver(schedule).observe(nav);
    if (document.fonts) document.fonts.ready.then(schedule); // widths change when the webfont lands
    layout();
})();
