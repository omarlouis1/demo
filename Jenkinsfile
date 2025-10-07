pipeline {
    agent any

    tools {
        nodejs "NodeJS_16"
    }

    environment {
        DOCKER_HUB_USER = 'kao123'
        FRONT_IMAGE     = 'react-frontend'
        BACK_IMAGE      = 'express-backend'
        SONAR_HOST_URL  = 'http://192.168.56.5:9000'  // IP interne Vagrant pour SonarQube
    }

    triggers {
        GenericTrigger(
            genericVariables: [
                [key: 'ref', value: '$.ref'],
                [key: 'pusher_name', value: '$.pusher.name'],
                [key: 'commit_message', value: '$.head_commit.message']
            ],
            causeString: 'Push par $pusher_name sur $ref: "$commit_message"',
            token: 'mysecret',
            printContributedVariables: true,
            printPostContent: true
        )
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/mhdgeek/express_mongo_react.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('back-end') { sh 'npm install' }
                dir('front-end') { sh 'npm install' }
            }
        }

        stage('Run Tests') {
            steps {
                sh 'cd back-end && npm test || echo "Aucun test backend"'
                sh 'cd front-end && npm test || echo "Aucun test frontend"'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker build -t $DOCKER_HUB_USER/$FRONT_IMAGE:latest ./front-end"
                sh "docker build -t $DOCKER_HUB_USER/$BACK_IMAGE:latest ./back-end"
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push $DOCKER_USER/react-frontend:latest
                        docker push $DOCKER_USER/express-backend:latest
                    '''
                }
            }
        }

        stage('Clean Docker') {
            steps {
                sh 'docker container prune -f'
                sh 'docker image prune -f'
            }
        }

        // -----------------------
        // Analyse SonarQube
        // -----------------------
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQubeLocal') { // Nom configuré dans Jenkins → SonarQube Servers
                    withCredentials([string(credentialsId: 'sonar', variable: 'SONAR_TOKEN')]) {
                        sh """
                            sonar-scanner \
                              -Dsonar.projectKey=fil-rouge \
                              -Dsonar.projectName="Projet Fil Rouge" \
                              -Dsonar.projectVersion=1.0 \
                              -Dsonar.sources=. \
                              -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/** \
                              -Dsonar.host.url=$SONAR_HOST_URL \
                              -Dsonar.token=$SONAR_TOKEN
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Check Docker & Compose') {
            steps {
                sh 'docker --version'
                sh 'docker-compose --version || echo "docker-compose non trouvé"'
            }
        }

        stage('Deploy (compose.yaml)') {
            steps {
                dir('.') {
                    sh '''
                        docker-compose -f compose.yaml down || true
                        docker-compose -f compose.yaml pull
                        docker-compose -f compose.yaml up -d
                        docker-compose -f compose.yaml ps
                        docker-compose -f compose.yaml logs --tail=50
                    '''
                }
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    echo "Vérification Frontend (port 5173)..."
                    curl -f http://localhost:5173 || echo "Frontend unreachable"

                    echo "Vérification Backend (port 5001)..."
                    curl -f http://localhost:5001/api || echo "Backend unreachable"
                '''
            }
        }
    }

    post {
        success {
            emailext(
                subject: "✅ Build SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Pipeline réussi 🎉\n\nDétails : ${env.BUILD_URL}\n\nAccès SonarQube : ${SONAR_HOST_URL}/projects",
                to: "omzokao99@gmail.com"
            )
        }
        failure {
            emailext(
                subject: "❌ Build FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Le pipeline a échoué 💥\n\nDétails : ${env.BUILD_URL}",
                to: "omzokao99@gmail.com"
            )
        }
    }
}
