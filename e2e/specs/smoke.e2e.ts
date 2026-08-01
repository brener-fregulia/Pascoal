describe('Pascoal launches', () => {
    it('shows the titlebar', async () => {
        const titlebar = await $('#titlebar')
        await expect(titlebar).toBeDisplayed()
    })

    it('shows the Welcome screen by default', async () => {
        const welcome = await $('#welcome')
        await expect(welcome).toBeDisplayed()
    })
})