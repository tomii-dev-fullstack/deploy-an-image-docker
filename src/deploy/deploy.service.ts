/* eslint-disable prettier/prettier */

import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import simpleGit from 'simple-git';

@Injectable()
export class DeployService {
    async deployRepodeployRepo(
        repoUrl: string,
        env: string,
    ): Promise<{ url: string }> {
        const projectId = uuidv4(); // ID único para el proyecto
        let envPath: string = ""
        // Usamos path.resolve para evitar advertencias de ESLint
        const basePath = path.resolve(__dirname, '../../docker-projects');
        const clonePath = path.resolve(basePath, projectId);

        const port = 3000 + Math.floor(Math.random() * 1000);

        try {
            // Aseguramos que la carpeta docker-projects exista
            if (!fs.existsSync(basePath)) {
                fs.mkdirSync(basePath, { recursive: true });
            }

            // Clonamos el repositorio
            await simpleGit().clone(repoUrl, clonePath);

         
            // Guardar variables de entorno si se enviaron
            if (env && env.trim().length > 0) {
                envPath = path.join(clonePath, '.env');
                fs.writeFileSync(envPath, env); // ya lo estás haciendo
            }
            // Verificamos si existe el Dockerfile
            const dockerfileExists = this.checkDockerfileExists(clonePath);

            if (!dockerfileExists) {
                console.log(`No se encontró Dockerfile. Creando uno básico...`);

                // Si el Dockerfile no existe, lo creamos
                this.createDockerfile(clonePath);
            } else {
                console.log(`Dockerfile encontrado en el repositorio.`);
            }

            // Verificamos si la imagen ya existe
            const imageExists = await this.checkImageExists(projectId);

            if (!imageExists) {
                console.log(`Imagen ${projectId} no encontrada. Creando la imagen...`);
                await this.runCommand(`docker build -t ${projectId} ${clonePath}`);
            } else {
                console.log(`La imagen ${projectId} ya existe. Usando la imagen existente.`);
            }

            await this.runCommand(`docker run -d -p ${port}:4000 --env-file ${envPath} --name ${projectId} ${projectId}`);

            return { url: `http://localhost:${port}` };
        } catch (err) {
            throw new Error(`Deploy failed: ${err}`);
        }
    }

    private runCommand(cmd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    console.error(stderr);
                    reject(err);
                } else {
                    console.log(stdout);
                    resolve(stdout); // Ahora devolvemos stdout como un string
                }
            });
        });
    }

    private checkDockerfileExists(clonePath: string): boolean {
        const dockerfilePath = path.join(clonePath, 'Dockerfile');
        return fs.existsSync(dockerfilePath); // Verifica si el Dockerfile existe
    }

    private createDockerfile(clonePath: string): void {
        const dockerfileContent = `
# Dockerfile básico para el repositorio
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
    `;
        const dockerfilePath = path.join(clonePath, 'Dockerfile');
        fs.writeFileSync(dockerfilePath, dockerfileContent);
        console.log('Dockerfile creado correctamente');
    }

    private async checkImageExists(imageName: string): Promise<boolean> {
        const checkCmd = `docker images -q ${imageName}`;
        const result = await this.runCommand(checkCmd);
        // Asegúrate de que el resultado no esté vacío
        return result.trim().length > 0; // Usamos trim para limpiar el resultado
    }
}
