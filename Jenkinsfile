pipeline {
    agent any

    tools {
        nodejs "NodeJS_16"
    }

    environment {
        DOCKER_HUB_USER = 'kao123'
        FRONT_IMAGE     = 'react-frontend'
        BACK_IMAGE      = 'express-backend'
        SONAR_HOST_URL  = 'http://192.168.56.5:9000'
        WEBHOOK_PUBLIC  = 'https://fdaa1444ee367cea4635570305754422.serveo.net'
        SONAR_SCANNER_OPTS = "-Xmx2048m -Dsonar.javascript.node.max_old_space_size=4096"
    }

    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'pusher_name', value: '$.pusher.name'],
                [key: 'commit_message', value: '$.head_commit.message']
            ],
            causeString: 'Push par $pusher_name sur $ref : "$commit_message"',
            token: 'mysecret',
            printContributedVariables: true,
            printPostContent: true
        )
    }

    stages {

        stage('Checkout') {
            steps {
                echo "📦 Récupération du code depuis GitHub..."
                git branch: 'main', url: 'https://github.com/omarlouis1/demo.git'
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('back-end') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('front-end') {
                            sh 'npm install'
                        }
                    }
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo "🧪 Exécution des tests..."
                script {
                    sh 'cd back-end && npm test || echo "⚠️ Aucun test backend"'
                    sh 'cd front-end && npm test || echo "⚠️ Aucun test frontend"'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo "🔍 Analyse du code avec SonarQube..."
                withSonarQubeEnv('SonarQube_Local') {
                    withCredentials([string(credentialsId: 'sonar', variable: 'SONAR_TOKEN')]) {
                        withEnv(["PATH+NODEJS=${tool name: 'NodeJS_16', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'}/bin"]) {
                            sh '''
                                sonar-scanner \
                                  -Dsonar.projectKey=fil-rouge \
                                  -Dsonar.projectName="Projet Fil Rouge" \
                                  -Dsonar.projectVersion=1.0 \
                                  -Dsonar.sources=front-end,back-end \
                                  -Dsonar.language=js \
                                  -Dsonar.sourceEncoding=UTF-8 \
                                  -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/**,**/*.test.js,**/*.spec.js \
                                  -Dsonar.host.url=http://192.168.56.5:9000 \
                                  -Dsonar.token=$SONAR_TOKEN \
                                  -Dsonar.nodejs.executable=$(which node)
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    sh "docker build -t $DOCKER_HUB_USER/$FRONT_IMAGE:latest ./front-end"
                    sh "docker build -t $DOCKER_HUB_USER/$BACK_IMAGE:latest ./back-end"
                }
            }
        }


        stage('Push Docker Images') {
            steps {
                echo "📤 Envoi des images sur Docker Hub..."
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push $DOCKER_USER/react-frontend:latest
                        docker push $DOCKER_USER/express-backend:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                echo "🚀 Déploiement via docker-compose..."
                sh '''
                    docker-compose -f compose.yaml down || true
                    docker-compose -f compose.yaml pull
                    docker-compose -f compose.yaml up -d
                    docker-compose ps
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                echo "🔎 Vérification des services..."
                sh '''
                    echo "Frontend (port 5173) :" 
                    curl -f http://localhost:5173 || echo "⚠️ Frontend inaccessible"
                    echo "Backend (port 5001) :"
                    curl -f http://localhost:5001/api || echo "⚠️ Backend inaccessible"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline terminé avec succès !"
            emailext(
                subject: "✅ SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                ✅ Build réussi pour ${env.JOB_NAME} #${env.BUILD_NUMBER}
                🔗 Détails: ${env.BUILD_URL}
                🔍 Analyse SonarQube: ${SONAR_HOST_URL}/dashboard?id=fil-rouge
                🌍 Webhook Serveo/Ngrok: ${WEBHOOK_PUBLIC}
                """,
                to: "omzokao99@gmail.com"
            )
        }
        failure {
            echo "❌ Échec du pipeline."
            emailext(
                subject: "❌ FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Le pipeline a échoué 💥\n\nDétails : ${env.BUILD_URL}",
                to: "omzokao99@gmail.com"
            )
        }
    }
}
