import { useEffect } from 'react';
import { useSocketStore } from '../stores/socketStore';

export const useSocket = () => {
    const { socket, connect } = useSocketStore();

    useEffect(() => {
        connect();
    }, [connect]);

    return socket;
};
