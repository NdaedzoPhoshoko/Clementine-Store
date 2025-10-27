import { useMemo } from 'react'

export default function useAccordionData({ details, sizeChart, careNotes, sustainabilityNotes, dimensions }) {
  return useMemo(() => {
    const items = []

    if (Array.isArray(careNotes) && careNotes.length > 0) {
      items.push({
        title: 'Care Notes',
        content: (
          <ul className="list-tabular">
            {careNotes.map((note, i) => (
              <li key={i} className="list-row">{note}</li>
            ))}
          </ul>
        )
      })
    }

    if (details?.features && Array.isArray(details.features) && details.features.length > 0) {
      items.push({
        title: 'Features',
        content: (
          <ul className="list-tabular">
            {details.features.map((feature, i) => (
              <li key={i} className="list-row">{feature}</li>
            ))}
          </ul>
        )
      })
    }

    if (details?.material) {
      items.push({
        title: 'Material',
        content: (
          <p className="material-row">{details.material}</p>
        )
      })
    }

    if (sizeChart && (
      Array.isArray(sizeChart) ? sizeChart.length > 0 : (typeof sizeChart === 'object' && Object.keys(sizeChart).length > 0)
    )) {
      const entries = Array.isArray(sizeChart) ? sizeChart : Object.entries(sizeChart)
      items.push({
        title: 'Size Chart',
        content: (
          <table className="size-chart-table">
            <thead>
              <tr>
                <th>Size</th>
                <th>Measurement</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row, i) => {
                const [size, measurement] = Array.isArray(row) ? row : [row?.size, row?.measurement]
                return (
                  <tr key={i}>
                    <td>{size}</td>
                    <td>{typeof measurement === 'string' ? measurement : JSON.stringify(measurement)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )
      })
    }

    if (dimensions && typeof dimensions === 'object') {
      const entries = Object.entries(dimensions).filter(([key]) => key !== 'size_chart')
      if (entries.length > 0) {
        items.push({
          title: 'Dimensions',
          content: (
            <ul className="list-tabular">
              {entries.map(([k, v], i) => (
                <li key={i} className="list-row">
                  {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </li>
              ))}
            </ul>
          )
        })
      }
    }

    if (Array.isArray(sustainabilityNotes) && sustainabilityNotes.length > 0) {
      items.push({
        title: 'Sustainability',
        content: (
          <ul className="list-tabular">
            {sustainabilityNotes.map((note, i) => (
              <li key={i} className="list-row">{note}</li>
            ))}
          </ul>
        )
      })
    }

    return items
  }, [details, sizeChart, careNotes, sustainabilityNotes, dimensions])
}