import * as React from "react";
import { useRouter } from 'next/router'
import Link from 'next/link';
import { NavDropdown } from 'react-bootstrap';


export default function Navbar({username, userId, duration, hideFilter, departments = [], depart}) {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  }

  let durationDisplay = "custom";
  if (duration === "1d") {
    durationDisplay = "today";
  } else if (duration === "7d") {
    durationDisplay = "this week";
  } else if (duration === "30d") {
    durationDisplay = "this month";
  } else if (duration === "1y") {
    durationDisplay = "this year";
  } else if (duration === "all") {
    durationDisplay = "all time";
  }

  let departDisplay = "all departments";
  const userGroups = departments.filter(d => d.id === depart);
  if (userGroups.length > 0) {
    departDisplay = userGroups[0].name;
  }

  const departItems = departments.map((userGroup, i) => {
    return (
      <Link href={`/?t=${duration}&depart=${userGroup.id}`} key={userGroup.id}>
        <NavDropdown.Item>{userGroup.name}</NavDropdown.Item>
      </Link>);
  });

  return (
    <nav className="navbar navbar-expand-lg navbar-default">
      <a className="navbar-brand" href="#" onClick={handleLogoClick}>
        <span style={{paddingLeft: "10px"}} className="logo">SlackerNews</span>
      </a>
      <div className="collapse navbar-collapse">
        <div className="align-items-center" style={{display: hideFilter ? "none" : "flex"}}>
          <ul className="navbar-nav" style={{paddingLeft: "30px"}}>
            <NavDropdown title={durationDisplay} id="collasible-nav-dropdown" className="duration-dropdown">
              <Link href={`/?t=1d&depart=${depart}`}><NavDropdown.Item>today</NavDropdown.Item></Link>
              <Link href={`/?t=7d&depart=${depart}`}><NavDropdown.Item>this week</NavDropdown.Item></Link>
              <Link href={`/?t=30d&depart=${depart}`}><NavDropdown.Item>this month</NavDropdown.Item></Link>
              <Link href={`/?t=1y&depart=${depart}`}><NavDropdown.Item>this year</NavDropdown.Item></Link>
              <Link href={`/?t=all&depart=${depart}`}><NavDropdown.Item>all time</NavDropdown.Item></Link>
            </NavDropdown>
          </ul>
          <span className="separator">{' '}|{' '}</span>
          <ul className="navbar-nav">
            <NavDropdown title={departDisplay} id="collasible-nav-dropdown" className="duration-dropdown">
              <Link href={`/?t=${duration}&depart=all`}><NavDropdown.Item>all departments</NavDropdown.Item></Link>
              {departItems}
            </NavDropdown>
          </ul>
        </div>
        <span className="navbar-text ms-auto" style={{paddingRight: "30px"}}>
          <Link href={`/user?id=${userId}`} className="username">{username}</Link>{' '}|{' '}<Link href="/logout"
                                                                                                   className="logout">logout</Link>
        </span>
      </div>
    </nav>
  );
}
