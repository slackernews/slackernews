import * as React from "react";
import { useRouter } from 'next/router'
import Link from 'next/link';
import { NavDropdown} from 'react-bootstrap';

export default function Navbar({ username, userId, duration, hideFilter, departments = [], depart, slackernewsVersion }) {
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

  const durations = [
    {name: "today", duration: "1d"},
    {name: "this week", duration: "7d"},
    {name: "this month", duration: "30d"},
    {name: "this year", duration: "1y"},
    {name: "all time", duration: "all"}
  ]

  return (
    <nav className="navbar navbar-expand-lg navbar-default">
      <a className="navbar-brand" href="#" onClick={handleLogoClick}>
        <span style={{paddingLeft: "10px"}} className="logo">SlackerNews</span>
      </a>
      <div className="collapse navbar-collapse">
        <div className="align-items-center" style={{display: hideFilter ? "none" : "flex"}}>
          <ul className="navbar-nav" style={{paddingLeft: "30px"}}>
            <NavDropdown title={durationDisplay} id="collasible-nav-dropdown" className="duration-dropdown" >
              {durations.map((d, i) => {
                const href = `/?t=${d.duration}&depart=${depart}`;
                return (
                  <Link href={href} key={i}>
                    <NavDropdown.Item href={href}>{d.name}</NavDropdown.Item>
                  </Link>);
              })}
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
          <Link href={`/user?id=${userId}`} className="username">{username}</Link>{' '}|{' '}<Link href="/logout" className="logout">logout</Link>
        </span>
      </div>
    </nav>
  );
}
