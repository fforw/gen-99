import domready from "domready"
import "./style.css"
import { randomPaletteWithBlack } from "./randomPalette"

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0,
    palette: null
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

function drawPolygon(pts, fill = true)
{
    if (fill)
    {
        ctx.fillStyle = config.palette[0|Math.random() * config.palette.length]
    }
    ctx.beginPath()
    const [x, y] = pts[0]
    ctx.moveTo(x, y)
    for (let i = 1; i < pts.length; i++)
    {
        const [x, y] = pts[i]
        ctx.lineTo(x, y)
    }
    ctx.lineTo(x, y)
    fill && ctx.fill()
    ctx.stroke()
}

const maxDepth = 10
const triLimit = 3
const triProbability = 0.05
const minCancelLevel = 4
const cancelProbability = 0.025


function edgeRatio(pts)
{
    const edges = [];

    const last = pts.length - 1
    for (let i = 0; i < pts.length; i++)
    {
        const [x0, y0] = pts[i]
        const [x1, y1] = i === last ? pts[0] : pts[i + 1]

        const dx = x1 - x0
        const dy = y1 - y0

        const dist = Math.sqrt(dx*dx+dy*dy)
        edges.push([i,dist])
    }

    edges.sort((a,b) => {
        return a[1] - b[1]
    })

    // longest side divided by shortest side
    const longest = edges[edges.length - 1]
    const shortest = edges[0]
    return [longest[0], longest[1] / shortest[1]]
}


function getSlices(numSlices)
{
    let sum = 0
    const slices = []
    for (let i = 0; i < numSlices; i++)
    {
        const s = 0.15 + Math.random() * 0.85
        slices.push(s)
        sum += s
    }

    const f = 1/sum

    for (let i = 0; i < slices.length; i++)
    {
        slices[i] *= f;
    }

    return slices
}



function descend(polygons, level = 0)
{
    const newPolygons = []

    for (let i = 0; i < polygons.length; i++)
    {
        let pts = polygons[i]

        if (level > minCancelLevel && Math.random() < cancelProbability)
        {
            drawPolygon(pts)
        }
        else
        {

            const [longestIndex, ratio] = edgeRatio(pts)

            console.log({longestIndex, ratio})
            if (pts.length === 4)
            {
                if (ratio < triLimit && Math.random() < triProbability)
                {
                    let [x0, y0] = pts[0]
                    let [x1, y1] = pts[1]
                    let [x2, y2] = pts[2]
                    let [x3, y3] = pts[3]

                    // rectanglish to tri
                    if (Math.random() < 0.5)
                    {
                        newPolygons.push(
                            [
                                [x0, y0],
                                [x1, y1],
                                [x3, y3]
                            ],
                            [
                                [x1, y1],
                                [x2, y2],
                                [x3, y3]
                            ],
                        )
                    }
                    else
                    {
                        newPolygons.push(
                            [
                                [x0, y0],
                                [x1, y1],
                                [x2, y2]
                            ],
                            [
                                [x0, y0],
                                [x2, y2],
                                [x3, y3]
                            ],
                        )
                    }
                }
                else
                {
                    if (longestIndex !== 0)
                    {
                        // make our longest edge the first edge
                        pts = pts.slice(longestIndex).concat(pts.slice(0, longestIndex))
                    }

                    const numSlices = 2 + Math.max(0, Math.floor(Math.random() * Math.ceil(ratio - 2)))

                    const slices = getSlices(numSlices)

                    //console.log({slices})

                    let [x0, y0] = pts[0]
                    let [x1, y1] = pts[1]
                    let [x2, y2] = pts[2]
                    let [x3, y3] = pts[3]

                    let sum = 0
                    for (let j = 0; j < slices.length; j++)
                    {
                        const slice = slices[j]

                        const tx0 = x0 + (x1 - x0) * sum
                        const ty0 = y0 + (y1 - y0) * sum
                        const bx0 = x3 + (x2 - x3) * sum
                        const by0 = y3 + (y2 - y3) * sum

                        sum += slice

                        const tx1 = x0 + (x1 - x0) * sum
                        const ty1 = y0 + (y1 - y0) * sum
                        const bx1 = x3 + (x2 - x3) * sum
                        const by1 = y3 + (y2 - y3) * sum

                        newPolygons.push([
                            [tx0, ty0],
                            [tx1, ty1],
                            [bx1, by1],
                            [bx0, by0],
                        ])
                    }
                }
            }
            else if (pts.length === 3)
            {
                const [x0, y0] = pts[0]
                const [x1, y1] = pts[1]
                const [x2, y2] = pts[2]

                const xm0 = (x0 + x1) / 2
                const ym0 = (y0 + y1) / 2
                const xm1 = (x1 + x2) / 2
                const ym1 = (y1 + y2) / 2
                const xm2 = (x0 + x2) / 2
                const ym2 = (y0 + y2) / 2

                const choice = Math.floor(Math.random() * 3)

                switch (choice)
                {
                    // cut off x0/y0
                    case 0:
                        newPolygons.push(
                            [
                                [xm0, ym0],
                                [x1, y1],
                                [x2, y2],
                                [xm2, ym2]
                            ]
                        )
                        break
                    // cut off x1/y1
                    case 1:
                        newPolygons.push(
                            [
                                [x0, y0],
                                [xm0, ym0],
                                [xm1, ym1],
                                [x2, y2],
                            ]
                        )
                        break
                    // cut off x2/y2
                    case 2:
                        newPolygons.push(
                            [
                                [x0, y0],
                                [x1, y1],
                                [xm1, ym1],
                                [xm2, ym2],
                            ]
                        )
                        break
                    // // inner triangle
                    // case 3:
                    //     newPolygons.push(
                    //         [
                    //             [xm0, ym0],
                    //             [xm1, ym1],
                    //             [xm2, ym2],
                    //         ]
                    //     )
                    //     break
                }
            }
            else
            {
                throw new Error("Invalid polygon: " + JSON.stringify(pts))
            }
        }
    }

    return newPolygons
}


domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        const paint = () => {

            const palette = randomPaletteWithBlack()
            config.palette = palette

            ctx.fillStyle = "#000";
            ctx.fillRect(0,0, width, height);

            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1

            let polygons = [
                [
                    [0,0],
                    [width - 1,0],
                    [width - 1,height - 1],
                    [0,height - 1]
                ]
            ]

            const baseDepth = 2 + Math.floor(Math.random() * 4)

            let base

            for (let i = 0; i < maxDepth; i++)
            {
                if (i === baseDepth)
                {
                    base = polygons
                }

                polygons =
                    descend(
                        polygons
                    )
            }

            polygons.forEach(drawPolygon)

            ctx.strokeStyle = palette[0|Math.random() * palette.length]
            ctx.lineWidth = 10
            base.forEach(p => drawPolygon(p, false))


        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
