import Link from 'next/link';
import React from 'react';

export default function EmptyRow({rowNumber}) {
  return (
    <tr>
      <th scope="row" style={{width: "32px", color: "#828282"}}>{rowNumber}</th>
      <td style={{width: "16px", paddingRight: "0px"}}>
        <div style={{width: "14px"}} />
      </td>
      <td style={{paddingLeft: "8px"}}>
        <br />
        {' '}
          <Link href={`#`} target="_blank" rel="noreferrer">
            {' '}<br />
            {' '}
          </Link>

      </td>
    </tr>
  )
}
