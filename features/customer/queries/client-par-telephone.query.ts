import { useQuery } from "@tanstack/react-query";
import { trouverClientParTelephone } from "../services/customer.service";
import { customerKeyQuery } from "./index.query";

/**
 * Le client qui porte ce numéro, s'il existe (27/11). `telephone` : numéro au
 * format du serveur, ou `null` pour ne rien chercher.
 */
export const useClientParTelephoneQuery = (telephone: string | null) =>
	useQuery({
		queryKey: customerKeyQuery("par-telephone", telephone),
		queryFn: () => trouverClientParTelephone(telephone as string),
		enabled: !!telephone,
		staleTime: 30 * 1000,
		retry: false,
	});
