// Keep Selecto's elements selected via box (drag) selection in sync with elements selected by click

import { useEffect } from 'react';

function useSelectoSync(pages, selectoRef) {

    useEffect(() => {
    const selectedPages = pages.filter((page) => page.selected === true);

    const selectedEls = [];
    selectedPages.forEach((selPage) => {
      const el = document.querySelector(`[data-id="${selPage.id}"]`);
      if (el) selectedEls.push(el);
    });

    if (selectoRef.current) {
        selectoRef.current.setSelectedTargets(selectedEls);
    }
    

    // console.log("pages", pages);
    // console.log("selectoRef.current", selectoRef.current?.getSelectedTargets());
 
  }, [pages]);
}

export default useSelectoSync;