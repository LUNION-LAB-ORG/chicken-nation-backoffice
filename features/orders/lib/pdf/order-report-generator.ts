import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Order, OrderType } from "../../types/order.types"

interface DayStats {
    date: string
    restaurants: {
        [restaurantName: string]: {
            app: number
            phone: number
            total: number // total brut (inclut annulées)
            delivery: number
            completed: number
            cancelled: number
        }
    }
}

interface TotalStats {
    app: number
    phone: number
    total: number // total brut
    delivery: number
    completed: number
    cancelled: number
}

function prepareDailyData(orders: Order[]): {
    dayStats: DayStats[]
    restaurantNames: string[]
    totals: { [restaurantName: string]: TotalStats }
    grandTotals: TotalStats
} {
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

        const dayData = daysMap.get(dayKey)!

        if (!dayData.restaurants[restaurantName]) {
            dayData.restaurants[restaurantName] = {
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

        const stats = dayData.restaurants[restaurantName]
        const totalStats = totals[restaurantName]

        // Canal de commande
        if (order.auto) {
            stats.app++
            totalStats.app++
        } else {
            stats.phone++
            totalStats.phone++
        }

        // Total brut
        stats.total++
        totalStats.total++

        // Type livraison
        if (order.type === OrderType.DELIVERY && order.status === "COMPLETED") {
            stats.delivery++
            totalStats.delivery++
        }

        // Statut commande
        if (order.status === "COMPLETED") {
            stats.completed++
            totalStats.completed++
        }

        if (order.status === "CANCELLED") {
            stats.cancelled++
            totalStats.cancelled++
        }
    })

    // Totaux généraux
    const grandTotals: TotalStats = {
        app: 0,
        phone: 0,
        total: 0,
        delivery: 0,
        completed: 0,
        cancelled: 0,
    }

    Object.values(totals).forEach((stats) => {
        grandTotals.app += stats.app
        grandTotals.phone += stats.phone
        grandTotals.total += stats.total
        grandTotals.delivery += stats.delivery
        grandTotals.completed += stats.completed
        grandTotals.cancelled += stats.cancelled
    })

    return {
        dayStats: Array.from(daysMap.values()),
        restaurantNames: Array.from(restaurantNamesSet).sort(),
        totals,
        grandTotals,
    }
}

export async function generateOrderReport(
    orders: Order[],
    date?: string
): Promise<void> {
    const { dayStats, restaurantNames, totals } = prepareDailyData(orders)

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    })

    // Titre
    doc.setFillColor(241, 121, 34)
    doc.rect(0, 0, 297, 15, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text(`RAPPORT${date ? ` : ${date}` : ""}`, 10, 10)

    const tableData: any[] = []
    const columns = ["Restaurants", ...restaurantNames, "TOTAUX"]

    // ===== PAR JOUR =====
    dayStats.forEach((day) => {
        tableData.push([
            {
                content: day.date.toUpperCase(),
                colSpan: columns.length,
                styles: {
                    fillColor: [241, 121, 34],
                    textColor: [255, 255, 255],
                },
            },
        ])

        const addRow = (label: string, key: keyof TotalStats) => {
            const row = [label]
            let total = 0

            restaurantNames.forEach((name) => {
                const value = (day.restaurants[name] as any)?.[key] || 0
                row.push(value.toString())
                total += value
            })

            row.push(total.toString())
            tableData.push(row)
        }

        addRow("Commandes application", "app")
        addRow("Commandes par téléphone", "phone")
        addRow("Total commande (brut)", "total")
        addRow("Commandes terminées", "completed")
        addRow("Commandes annulées", "cancelled")
        addRow("Livraison", "delivery")
    })

    // ===== TOTAUX GÉNÉRAUX =====
    const addTotalRow = (label: string, key: keyof TotalStats) => {
        const row = [label]
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
    addTotalRow("TOTAL Commandes par téléphone", "phone")
    addTotalRow("TOTAL commande (brut)", "total")
    addTotalRow("TOTAL Commandes terminées", "completed")
    addTotalRow("TOTAL Commandes annulées", "cancelled")
    addTotalRow("TOTAL Livraison", "delivery")

    // Génération du tableau
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
            fillColor: [241, 121, 34],
            textColor: [255, 255, 255],
            fontStyle: "bold",
        },
        columnStyles: {
            0: {
                fillColor: [245, 245, 245],
            },
        },
        didParseCell: (data) => {
            if (
                data.section === "body" &&
                data.row.index >= tableData.length - 6
            ) {
                data.cell.styles.fillColor = [241, 121, 34]
                data.cell.styles.textColor = [255, 255, 255]
                data.cell.styles.fontStyle = "bold"
            }
        },
    })

    const filename = `rapport_commandes_${new Date()
        .toISOString()
        .split("T")[0]}.pdf`

    doc.save(filename)
}
