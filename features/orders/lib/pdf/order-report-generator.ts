import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Order, OrderType } from "../../types/order.types"

/* ======================================================
   TYPES
====================================================== */

interface DayStats {
    date: string
    restaurants: {
        [restaurantName: string]: {
            app: number
            phone: number
            total: number
            delivery: number
            completed: number
            cancelled: number
        }
    }
}

interface TotalStats {
    app: number
    phone: number
    total: number
    delivery: number
    completed: number
    cancelled: number
}

type StatLevel = "LOW" | "NORMAL" | "GOOD" | "EXCELLENT"

/* ======================================================
   COULEURS & SEUILS
====================================================== */

const COLORS = {
    ORANGE: [241, 121, 34] as [number, number, number],
    LIGHT_GRAY: [245, 245, 245] as [number, number, number],

    RED_BG: [255, 230, 230] as [number, number, number],
    RED_TXT: [180, 0, 0] as [number, number, number],

    GREEN_BG: [230, 255, 230] as [number, number, number],
    GREEN_TXT: [0, 120, 0] as [number, number, number],

    BLUE_BG: [230, 240, 255] as [number, number, number],
    BLUE_TXT: [0, 70, 160] as [number, number, number],
}

const SEUIL = 50;
function getDayStatLevel(value: number): StatLevel {
    if (value >= SEUIL * 2) return "EXCELLENT"
    if (value > SEUIL) return "GOOD"
    if (value < SEUIL) return "LOW"
    return "NORMAL"
}

function getTotalStatLevel(
    value: number,
    numberOfDays: number
): StatLevel {
    const target = SEUIL * numberOfDays

    if (value >= target * 2) return "EXCELLENT"
    if (value > target) return "GOOD"
    if (value < target) return "LOW"
    return "NORMAL"
}

function applyStatColor(cell: any, level: StatLevel) {
    switch (level) {
        case "LOW":
            cell.styles.fillColor = COLORS.RED_BG
            cell.styles.textColor = COLORS.RED_TXT
            break
        case "GOOD":
            cell.styles.fillColor = COLORS.GREEN_BG
            cell.styles.textColor = COLORS.GREEN_TXT
            break
        case "EXCELLENT":
            cell.styles.fillColor = COLORS.BLUE_BG
            cell.styles.textColor = COLORS.BLUE_TXT
            break
        default:
            break
    }
}

/* ======================================================
   PRÉPARATION DES DONNÉES
====================================================== */

function prepareDailyData(orders: Order[]) {
    const daysMap = new Map<string, DayStats>()
    const restaurantNamesSet = new Set<string>()
    const totals: { [restaurantName: string]: TotalStats } = {}

    orders.forEach((order) => {
        const date = new Date(order.created_at)
        const dayKey = date.toISOString().split("T")[0]
        const dayName = date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        })

        const restaurantName = order.restaurant?.name || "Sans restaurant"
        restaurantNamesSet.add(restaurantName)

        if (!daysMap.has(dayKey)) {
            daysMap.set(dayKey, {
                date: dayName,
                restaurants: {},
            })
        }

        if (!daysMap.get(dayKey)!.restaurants[restaurantName]) {
            daysMap.get(dayKey)!.restaurants[restaurantName] = {
                app: 0,
                phone: 0,
                total: 0,
                delivery: 0,
                completed: 0,
                cancelled: 0,
            }
        }

        if (!totals[restaurantName]) {
            totals[restaurantName] = {
                app: 0,
                phone: 0,
                total: 0,
                delivery: 0,
                completed: 0,
                cancelled: 0,
            }
        }

        const stats = daysMap.get(dayKey)!.restaurants[restaurantName]
        const totalStats = totals[restaurantName]

        if (order.auto) {
            stats.app++
            totalStats.app++
        } else {
            stats.phone++
            totalStats.phone++
        }

        stats.total++
        totalStats.total++

        if (order.status === "COMPLETED") {
            stats.completed++
            totalStats.completed++
        }

        if (order.status === "CANCELLED") {
            stats.cancelled++
            totalStats.cancelled++
        }

        if (order.type === OrderType.DELIVERY && order.status === "COMPLETED") {
            stats.delivery++
            totalStats.delivery++
        }
    })

    return {
        dayStats: Array.from(daysMap.values()),
        restaurantNames: Array.from(restaurantNamesSet).sort(),
        totals,
        numberOfDays: daysMap.size,
    }
}

/* ======================================================
   GÉNÉRATION DU PDF
====================================================== */

export async function generateOrderReport(
    orders: Order[],
    date?: string
): Promise<void> {
    const { dayStats, restaurantNames, totals, numberOfDays } =
        prepareDailyData(orders)

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    })

    /* ===== TITRE ===== */
    doc.setFillColor(...COLORS.ORANGE)
    doc.rect(0, 0, 297, 15, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text(
        `RAPPORT DES COMMANDES${date ? ` : ${date}` : ""}`,
        10,
        10
    )

    const columns = ["Restaurants", ...restaurantNames, "TOTAL"]
    const tableData: any[] = []

    /* ===== DONNÉES JOURNALIÈRES ===== */
    dayStats.forEach((day) => {
        tableData.push([
            {
                content: day.date.toUpperCase(),
                colSpan: columns.length,
                styles: {
                    fillColor: COLORS.ORANGE,
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                },
            },
        ])

        const addRow = (label: string, key: keyof TotalStats) => {
            const row: any[] = [{ content: label, rawKey: key }]
            let total = 0

            restaurantNames.forEach((name) => {
                const value = day.restaurants[name]?.[key] || 0
                row.push(value.toString())
                total += value
            })

            row.push(total.toString())
            tableData.push(row)
        }

        addRow("Commandes application", "app")
        addRow("Commandes par téléphone", "phone")
        addRow("Total commandes (brut)", "total")
        addRow("Commandes terminées", "completed")
        addRow("Commandes annulées", "cancelled")
        addRow("Livraisons", "delivery")
    })

    /* ===== SÉPARATEUR DES TOTAUX ===== */
    tableData.push([
        {
            content: "TOTAUX DE LA PÉRIODE",
            colSpan: columns.length,
            styles: {
                fillColor: COLORS.LIGHT_GRAY,
                fontStyle: "bold",
                halign: "center",
            },
        },
    ])

    /* ===== TOTAUX ===== */
    const addTotalRow = (label: string, key: keyof TotalStats) => {
        const row: any[] = [{ content: label, rawKey: key, isTotal: true }]
        let total = 0

        restaurantNames.forEach((name) => {
            const value = totals[name]?.[key] || 0
            row.push(value.toString())
            total += value
        })

        row.push(total.toString())
        tableData.push(row)
    }

    addTotalRow("TOTAL Commandes application", "app")
    addTotalRow("TOTAL Commandes téléphone", "phone")
    addTotalRow("TOTAL commandes (brut)", "total")
    addTotalRow("TOTAL Commandes terminées", "completed")
    addTotalRow("TOTAL Commandes annulées", "cancelled")
    addTotalRow("TOTAL Livraisons", "delivery")

    /* ===== TABLE ===== */
    autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 20,
        theme: "grid",
        styles: {
            fontSize: 8,
            cellPadding: 2,
        },
        headStyles: {
            fillColor: COLORS.ORANGE,
            textColor: [255, 255, 255],
            fontStyle: "bold",
        },
        columnStyles: {
            0: { fillColor: COLORS.LIGHT_GRAY },
        },
        didParseCell: (data) => {
            const row = data.row.raw as any[]
            const firstCell = row?.[0]
            if (!firstCell || data.column.index === 0) return

            const value = Number(data.cell.text?.[0])
            if (isNaN(value)) return

            const key = firstCell.rawKey
            const isTotal = firstCell.isTotal

            if (key === "completed" || key === "delivery") {
                const level = isTotal
                    ? getTotalStatLevel(value, numberOfDays)
                    : getDayStatLevel(value)

                applyStatColor(data.cell, level)
            }

            if (isTotal) {
                data.cell.styles.fontStyle = "bold"
                data.cell.styles.lineWidth = 0.3
            }
        },
    })

    doc.save(
        `rapport_commandes_${new Date().toISOString().split("T")[0]}.pdf`
    )
}
