const { test, expect, describe, beforeEach } = require('@playwright/test')

describe('Blog List App', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Winnie Pooh',
        username: 'PoohBear',
        password: 'honeyjar00'
      }
    })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Blog List App')).toBeVisible()
    await expect(page.getByText('Log in to see the blogs')).toBeVisible()
    await expect(page.getByTestId('username')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByTestId('username').fill('PoohBear')
      await page.getByTestId('password').fill('honeyjar00')
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page.getByText('Log in to see the blogs')).toBeHidden()
      await expect(page.getByText('Winnie Pooh logged in')).toBeVisible()
    })
  
    test('fails with wrong credentials', async ({ page }) => {
      await page.getByTestId('username').fill('PoohBear')
      await page.getByTestId('password').fill('honeyjar')
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page.getByText('Invalid credentials')).toBeVisible()
      await expect(page.getByText('Log in to see the blogs')).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await page.getByTestId('username').fill('PoohBear')
      await page.getByTestId('password').fill('honeyjar00')
      await page.getByRole('button', { name: 'Log in' }).click()
    })
    
    test('a new blog can be created', async ({ page }) => {
      await page.getByRole('button', { name: 'Add new blog' }).click()
      await page.getByTestId('title').fill('Sweets & Socks')
      await page.getByTestId('author').fill('Maarit')
      await page.getByTestId('url').fill('https://lankakerablogi.blogspot.com/')
      await page.getByRole('button', { name: 'Add blog' }).click()

      await expect(page.getByText('Sweets & Socks by Maarit was added to blog list')).toBeVisible()
      await expect(page.getByText('Sweets & Socks by Maarit', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Show' })).toBeVisible()
    })

    describe('With one blog added and shown', () => {
      beforeEach(async ({ page }) => {
        await page.getByRole('button', { name: 'Add new blog' }).click()
        await page.getByTestId('title').fill('Sweets & Socks')
        await page.getByTestId('author').fill('Maarit')
        await page.getByTestId('url').fill('https://lankakerablogi.blogspot.com/')
        await page.getByRole('button', { name: 'Add blog' }).click()
        await page.getByRole('button', { name: 'Show' }).click()
      })

      test('a blog can be liked', async ({ page }) => {
        await expect(page.getByText('Likes: 0')).toBeVisible()
        await page.getByRole('button', { name: 'Like' }).click()
        await expect(page.getByText('Likes: 0')).toBeHidden()
        await expect(page.getByText('Likes: 1')).toBeVisible()
      })

      test('a blog can be deleted', async ({ page }) => {
        await expect(page.getByText('Sweets & Socks by Maarit', { exact: true })).toBeVisible()
        page.on('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: 'Delete blog' }).click()
        await expect(page.getByText('Sweets & Socks by Maarit', { exact: true })).toBeHidden()
      })

      describe('With other user logging in', () => {
        beforeEach(async ({ page, request }) => {
          await request.post('http://localhost:3003/api/users', {
            data: {
              name: 'Piglet',
              username: 'Piggy',
              password: 'scaredofhackers'
            }
          })
          await page.getByRole('button', { name: 'Log out' }).click()
          await page.getByTestId('username').fill('Piggy')
          await page.getByTestId('password').fill('scaredofhackers')
          await page.getByRole('button', { name: 'Log in' }).click()
        })

        test('cannot see delete button with blog from other user', async ({ page }) => {
          await expect(page.getByText('Sweets & Socks by Maarit', { exact: true })).toBeVisible()
          await expect(page.getByRole('button', { name: 'Delete blog' })).toBeHidden()
        })
      })

      describe('with another blog added and shown', async () => {
        beforeEach(async ({ page }) => {
          await page.getByRole('button', { name: 'Add new blog' }).click()
          await page.getByTestId('title').fill('Suklaapossu')
          await page.getByTestId('author').fill('Suklaapossu')
          await page.getByTestId('url').fill('https://suklaapossu.blogspot.com/')
          await page.getByRole('button', { name: 'Add blog' }).click()
          await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0)
          const buttons = await page.getByRole('button', { name: 'Show' }).all()
          for (let b of buttons) {
            await b.click()
          }
          await page.keyboard.press('PageDown')
        })

        test('blogs are ordered by likes', async ({ page }) => {
          await expect(page.locator('.blog').first()).toHaveText(/Sweets & Socks/)
          await expect(page.locator('.blog').last()).toHaveText(/Suklaapossu/)
          await page.getByRole('button', { name: 'Like' }).nth(1).click()
          await page.locator('p').filter({ hasText: 'Likes: 1Like' }).getByRole('button').click();
          await expect(page.locator('.blog').first()).toHaveText(/Suklaapossu/)
          await expect(page.locator('.blog').last()).toHaveText(/Sweets & Socks/)
          await page.locator('p').filter({ hasText: 'Likes: 0Like' }).getByRole('button').click();
          await expect(page.locator('.blog').first()).toHaveText(/Suklaapossu/)
          await expect(page.locator('.blog').last()).toHaveText(/Sweets & Socks/)
        })
      })
    })
  })
})