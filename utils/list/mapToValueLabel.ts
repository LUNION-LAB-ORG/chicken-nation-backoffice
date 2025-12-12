/**
 * Mappe un tableau d'objets vers un format standardisé { value, label }.
 *
 * @template T Le type des objets dans le tableau source.
 * @param array Le tableau d'objets source.
 * @param valueProp La clé de la propriété à utiliser comme 'value'.
 * @param labelProp La clé de la propriété à utiliser comme 'label'.
 * @param transform Un paramètre optionnel pour transformer les valeurs 'value' et 'label'
 * avant de créer l'objet final { value, label }.
 * @returns Un tableau d'objets au format { value: any, label: any }.
 */
export function mapToValueLabel<T extends Record<string, any>>(
    array: T[],
    valueProp: keyof T,
    labelProp: keyof T,
    transform?: (
        value: T[typeof valueProp],
        label: T[typeof labelProp],
        item: T
    ) => { value: any; label: any }
): { value: any; label: any }[] {
    if (!array || array.length === 0) {
        return [];
    }

    return array.map((item) => {
        const rawValue = item[valueProp];
        const rawLabel = item[labelProp];

        if (transform) {
            // Si une fonction de transformation est fournie, l'utiliser.
            return transform(rawValue, rawLabel, item);
        }

        // Sinon, utiliser les valeurs brutes.
        return {
            value: rawValue,
            label: rawLabel,
        };
    });
}