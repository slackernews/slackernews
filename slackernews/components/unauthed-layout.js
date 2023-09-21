import Footer from './footer'

export default function Unauthed({ children }) {
  return (
    <>
      <div className="col-lg-8 mx-auto" style={{width: "85%"}}>
        <div className="body">
          <main>{children}</main>
        </div>
        <Footer hideSearch={true} />
      </div>
    </>
  )
}
