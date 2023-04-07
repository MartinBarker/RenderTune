
import React from 'react';

class ProjectsFunctional extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            'projects': {}
        };
    }

    saveProjects = () => {
        localStorage.setItem('projects', this.state.projects)
    }

    getProjectId = () => {
        let id = Date.now();
        while(this.state.projects[id]){
            id = Date.now();
        }
        return id.toString().slice(-6);;
    }
    
    addProject = () => {
        console.log('Projects: ')
       
        let projectId = this.getProjectId();
        let projectDetails = {
            'name':`Project-${projectId}`
        }

        let oldProjects = this.state.projects;
        oldProjects[projectId]=projectDetails
        this.setState({projects: oldProjects})
        

        
        console.log('Project added: ', this.state['projects'])
      
    }

    

    render() {
        return <>
            <button onClick={() => { this.addProject() }} >Add Project</button>
            
            <h3>{Object.keys(this.state.projects).length} Projects</h3>
            
            {Object.entries(this.state.projects).map((item) => {
                return <div key={item}>
                    <h3>{item.name}</h3>
                </div>
            })}   
   

        </>;
    }
}

export default ProjectsFunctional;