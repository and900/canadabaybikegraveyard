import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { Polygon } from 'geojson'
import { describe, expect, it } from 'vitest'
import council from '../data/council.json'
import places from '../data/places.json'
import { where } from './geo'

// §4.1's suburbs, wholly and partly inside the council.
const WHOLLY_INSIDE =
  'Abbotsford, Breakfast Point, Cabarita, Canada Bay, Chiswick, Concord, Concord West, Drummoyne, Five Dock, Liberty Grove, Mortlake, North Strathfield, Rhodes, Rodd Point, Russell Lea, Wareemba'
const PARTLY_INSIDE = 'Ashfield, Burwood, Croydon, Haberfield, Homebush, Strathfield, Sydney Olympic Park'

describe('where', () => {
  it('finds a point on Broughton St, Drummoyne', () => {
    expect(where(-33.85789, 151.15052)).toEqual({ inside: true, suburb: 'Drummoyne', street: 'Broughton St' })
  })

  it("counts Arlington St, Croydon, 6.5 m outside the council's boundary but inside the 20 m strip", () => {
    expect(where(-33.87307, 151.12603)).toEqual({ inside: true, suburb: 'Croydon', street: 'Arlington St' })
  })

  it('refuses Acton St, Croydon, 48 m outside the boundary: about 28 m beyond the 20 m strip', () => {
    expect(where(-33.87114, 151.11686)).toMatchObject({ inside: false, street: 'Acton St' })
  })
})

describe('places.json', () => {
  it('has every suburb wholly or partly inside the council, and the neighbours that touch the strip', () => {
    const names = places.suburbs.map((suburb) => suburb.name)
    expect(names).toEqual(expect.arrayContaining(`${WHOLLY_INSIDE}, ${PARTLY_INSIDE}`.split(', ')))
  })
})

describe('council.json', () => {
  it('names every suburb wholly inside the council on the map, at a point inside the council', () => {
    expect(council.labels.map((label) => label.name)).toEqual(expect.arrayContaining(WHOLLY_INSIDE.split(', ')))
    for (const { name, at } of council.labels)
      expect(booleanPointInPolygon(at, council.boundary as Polygon), name).toBe(true)
  })
})
