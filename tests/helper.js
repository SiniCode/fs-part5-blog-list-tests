const logIn = async (page, username, password) => {
  await page.getByTestId('username').fill(username)
  await page.getByTestId('password').fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
}

const addBlog = async (page, title, author, url) => {
  await page.getByRole('button', { name: 'Add new blog' }).click()
  await page.getByTestId('title').fill(title)
  await page.getByTestId('author').fill(author)
  await page.getByTestId('url').fill(url)
  await page.getByRole('button', { name: 'Add blog' }).click()
}

export { logIn, addBlog }
