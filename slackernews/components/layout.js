import Navbar from './navbar'
import Footer from './footer'
import Head from 'next/head'

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>SlackerNews</title>
      </Head>
      <div className="col-lg-8 mx-auto" style={{width: "85%"}}>
        <Navbar {...children.props} />
          <div className="body">
            <main>{children}</main>
          </div>
        <Footer />
      </div>
    </>
  )
}

