describe('Editor highlighting', () => {
    it('creates a new file with the default template via the File menu', async () => {
        const fileMenu = await $('aria/File')
        await fileMenu.click()

        const newFileItem = await $('aria/New File')
        await newFileItem.click()

        const editorContent = await $('.cm-content')
        await expect(editorContent).toBeDisplayed()
    })

    it('applies Tree-sitter highlighting to a builtin type', async () => {
        const editorContent = await $('.cm-content')
        await editorContent.click()

        // Replace whatever the template contains with known content, so
        // this test doesn't depend on PASCAL_TEMPLATE's exact text.
        await browser.keys(['Control', 'a'])
        await browser.keys('var\n  X: Integer;\nbegin\nend.')

        // The highlight pass is debounced (150ms in pascal-treesitter.ts)
        // plus a real Tauri IPC round trip to highlight_pascal - give it
        // actual time to settle instead of asserting immediately.
        await browser.pause(500)

        const typeSpan = await $('span.cm-ts-type')
        await expect(typeSpan).toBeDisplayed()
        await expect(typeSpan).toHaveText('Integer')
    })

    it('applies Tree-sitter highlighting to a user-defined type', async () => {
        const editorContent = await $('.cm-content')
        await editorContent.click()

        await browser.keys(['Control', 'a'])
        await browser.keys('type\n  TPerson = record\n  end;\nbegin\nend.')

        await browser.pause(500)

        const typeSpans = await $$('span.cm-ts-type')
        const texts = await typeSpans.map((el) => el.getText())
        expect(texts).toContain('TPerson')
    })

    it('applies Tree-sitter highlighting to a keyword', async () => {
        const editorContent = await $('.cm-content')
        await editorContent.click()

        await browser.keys(['Control', 'a'])
        await browser.keys('begin\nend.')

        await browser.pause(500)

        const keywordSpans = await $$('span.cm-ts-keyword')
        const texts = await keywordSpans.map((el) => el.getText())
        expect(texts).toContain('begin')
        expect(texts).toContain('end')
    })
})