import { useRouter, type RouteLocationRaw, type RouteParamsRawGeneric } from "vue-router";

export default function useLinkRoute() {
    const router = useRouter();

    const linkByRoute = (route: RouteLocationRaw) => {
        window.open(router.resolve(route).href, "_blank");
    };
    const linkByName = (name: string, params?: RouteParamsRawGeneric) => {
        linkByRoute({ name: name, params: params });
    };
    return { linkByRoute, linkByName };
}
