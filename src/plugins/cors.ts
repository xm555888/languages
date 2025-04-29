import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyPluginAsync } from 'fastify';
import { SECURITY } from '../config';

// 创建CORS插件
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(cors, {
    origin: SECURITY.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
};

export default fp(corsPlugin, { name: 'cors' });
